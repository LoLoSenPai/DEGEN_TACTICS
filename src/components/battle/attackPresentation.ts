import type { Enemy, PlayerUnit } from "../../lib/game/types";

export type AttackOutcomePreview = Readonly<{
  intendedId: string;
  receiverId: string;
  receiverName: string;
  intercepted: boolean;
  damage: number;
  fatal: boolean;
}>;

export function buildAttackOutcomePreview(
  unit: PlayerUnit,
  target: Enemy,
  receiver: Enemy,
  deadeye: boolean,
): AttackOutcomePreview {
  const rawDamage = deadeye ? 4 : unit.attackDamage;
  const damage = Math.min(receiver.hp, rawDamage);
  return {
    intendedId: target.id,
    receiverId: receiver.id,
    receiverName: receiver.name,
    intercepted: receiver.id !== target.id,
    damage,
    fatal: damage >= receiver.hp,
  };
}
