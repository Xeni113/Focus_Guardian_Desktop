import { pipeline, env } from '@huggingface/transformers';

// Configure environment for local WebAssembly execution
env.allowLocalModels = false; // Downloads & caches the ONNX model locally on first load
env.backends.onnx.wasm.numThreads = 2; // Keep background CPU usage lightweight (<0.3%)

let featureExtractor: any = null;

/**
 * Initializes the quantized 384-dimensional embedding pipeline
 */
export async function initSemanticEngine() {
    if (!featureExtractor) {
        console.log('[FocusGuardian AI] Loading local MiniLM embedding pipeline...');
        // Load feature extraction pipeline with 8-bit quantized MiniLM model
        featureExtractor = await pipeline(
            'feature-extraction',
            'Xenova/all-MiniLM-L6-v2',
            { dtype: 'q8' }
        );
        console.log('[FocusGuardian AI] Semantic Engine initialized successfully!');
    }
}

/**
 * Computes Dot Product (Cosine Similarity for unit-normalized vectors)
 * cos(θ) = A · B
 */
function computeCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    let dotProduct = 0;
    for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
    }
    return dotProduct;
}

export interface ActivityEvaluation {
    similarity: number; // Score between -1.0 and 1.0
    confidence: number; // Percentage 0 - 100%
    classification: 'PRODUCTIVE' | 'NEUTRAL' | 'DISTRACTING';
}

/**
 * Evaluates current window title against the active goal
 */
export async function evaluateActivity(
    goalText: string,
    windowTitle: string
): Promise<ActivityEvaluation> {
    if (!featureExtractor) {
        await initSemanticEngine();
    }

    // Batch embed both strings in a single call for high performance
    const output = await featureExtractor([goalText, windowTitle], {
        pooling: 'mean',
        normalize: true, // Output is pre-normalized (|A| = 1), enabling fast dot-product cosine similarity
    });

    const vectors = output.tolist();
    const goalVector = vectors[0];
    const activityVector = vectors[1];

    const similarity = computeCosineSimilarity(goalVector, activityVector);

    // Confidence mapping and state thresholds
    const confidence = Math.min(Math.round(Math.abs(similarity) * 100 + 30), 99);

    let classification: 'PRODUCTIVE' | 'NEUTRAL' | 'DISTRACTING' = 'NEUTRAL';

    if (similarity >= 0.40) {
        classification = 'PRODUCTIVE';
    } else if (similarity < 0.20) {
        classification = 'DISTRACTING';
    } else {
        classification = 'NEUTRAL';
    }

    return {
        similarity: parseFloat(similarity.toFixed(4)),
        confidence,
        classification,
    };
}
