import { Contract } from "ethers";

export const SKT_ADDRESS =
  "0x3270D5a4e959FCabD1e06cc3B2a9d9334BbF9B0e";

/*
 * =========================================================
 * Skill Token ABI
 * =========================================================
 *
 * ใช้สำหรับ:
 *
 * - อ่าน Balance
 * - อ่าน Decimals
 * - อ่าน Symbol
 * - ส่ง Token
 * - อ่านประวัติ Transfer จาก Blockchain
 */
export const SKT_ABI = [
  /*
   * อ่านยอด Token
   */
  "function balanceOf(address owner) view returns (uint256)",

  /*
   * จำนวน Decimals ของ Token
   */
  "function decimals() view returns (uint8)",

  /*
   * Symbol เช่น SKT
   */
  "function symbol() view returns (string)",

  /*
   * ส่ง Token
   */
  "function transfer(address to, uint256 amount) returns (bool)",

  /*
   * =======================================================
   * Transfer Event
   * =======================================================
   *
   * Event นี้จะถูกสร้างทุกครั้งที่ SKT
   * ถูกโอนจาก Wallet หนึ่งไปอีก Wallet หนึ่ง
   *
   * เราจะใช้ Event นี้ทำหน้า:
   *
   * ประวัติ
   *
   * เช่น:
   *
   * ส่ง 50 SKT
   * Account A → Account B
   *
   * หรือ
   *
   * รับ 100 SKT
   * Account C → Account A
   */
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

export function getSkillTokenContract(
  providerOrSigner: any
) {
  return new Contract(
    SKT_ADDRESS,
    SKT_ABI,
    providerOrSigner
  );
}