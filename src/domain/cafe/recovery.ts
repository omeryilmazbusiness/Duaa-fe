import type { CafeVoice, RecoveryAction, RecoveryStatus } from "./qr";

export function isOpenRecovery(status: RecoveryStatus | ""): boolean {
  return status === "open" || status === "assigned";
}

export function canActRecovery(voice: CafeVoice): boolean {
  return voice.needsRecovery && isOpenRecovery(voice.recoveryStatus);
}

export function canCompensate(voice: CafeVoice): boolean {
  return canActRecovery(voice) && voice.compensationLimit > 0 && voice.compensationAmount === 0;
}

export function isRecoveryAction(value: string): value is RecoveryAction {
  return value === "assign" || value === "compensate" || value === "close";
}
