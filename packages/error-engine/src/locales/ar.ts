import { LoydErrorCode } from "../codes.js";
import type { MessageMap } from "../formatter.js";
export const ar: MessageMap = {
  [LoydErrorCode.REQUIRED]: "هذا الحقل مطلوب",
  [LoydErrorCode.STRING_INVALID_EMAIL]: "عنوان البريد الإلكتروني غير صالح",
  [LoydErrorCode.NUMBER_NOT_INTEGER]: "يجب أن يكون عددًا صحيحًا",
};
