export type AttentionState =
    | 'DEEP_FOCUS'
    | 'FOCUSED'
    | 'DRIFTING'
    | 'RESTLESS'
    | 'DISTRACTED'
    | 'FATIGUED';

export interface AttentionAnalysis {
    state: AttentionState;
    confidence: number;
    driftRisk: number; // 0.0 to 1.0 (0% to 100%)
    reason: string;
}

export function inferAttentionState(
    similarity: number,
    switchCount2Min: number,
    dwellTimeSeconds: number,
    sessionMinutes: number
): AttentionAnalysis {

    // 1. Check Fatigue Condition (Long continuous session + high switches)
    if (sessionMinutes > 60 && switchCount2Min > 8) {
        return {
            state: 'FATIGUED',
            confidence: 88,
            driftRisk: 0.82,
            reason: 'Session time exceeds 60m with high switching frequency',
        };
    }

    // 2. Check Restless Condition (High switches regardless of content)
    if (switchCount2Min >= 7) {
        return {
            state: 'RESTLESS',
            confidence: 82,
            driftRisk: 0.65,
            reason: 'Rapid context switching detected (>7 switches in 2 mins)',
        };
    }

    // 3. Evaluate Semantic Alignment
    if (similarity >= 0.45) {
        if (dwellTimeSeconds > 300 && switchCount2Min <= 2) {
            return {
                state: 'DEEP_FOCUS',
                confidence: 95,
                driftRisk: 0.05,
                reason: 'Sustained high goal-alignment with stable context',
            };
        }
        return {
            state: 'FOCUSED',
            confidence: 90,
            driftRisk: 0.15,
            reason: 'Content strongly matches declared goal',
        };
    }

    // 4. Low Semantic Alignment
    if (similarity < 0.20) {
        if (dwellTimeSeconds > 60) {
            return {
                state: 'DISTRACTED',
                confidence: 91,
                driftRisk: 0.95,
                reason: 'Active content diverges significantly from goal',
            };
        }
        return {
            state: 'DRIFTING',
            confidence: 76,
            driftRisk: 0.55,
            reason: 'Early indicator: User switched away from primary goal',
        };
    }

    return {
        state: 'FOCUSED',
        confidence: 70,
        driftRisk: 0.30,
        reason: 'Neutral context, within acceptable drift margins',
    };
}