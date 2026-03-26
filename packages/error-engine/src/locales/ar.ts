import type { MessageMap } from "../formatter.js";
import { LoydErrorCode } from "../codes.js";

export const ar: MessageMap = {
  [LoydErrorCode.REQUIRED]:             "هذا الحقل مطلوب",
  [LoydErrorCode.INVALID_TYPE]:         ({ expected, received }) => `النوع المتوقع: ${expected}، المستلم: ${received}`,
  [LoydErrorCode.STRING_TOO_SHORT]:     ({ min, actual }) => `الحد الأدنى ${min} حرفًا (تم استلام: ${actual})`,
  [LoydErrorCode.STRING_TOO_LONG]:      ({ max, actual }) => `الحد الأقصى ${max} حرفًا (تم استلام: ${actual})`,
  [LoydErrorCode.STRING_INVALID_EMAIL]: "عنوان البريد الإلكتروني غير صالح",
  [LoydErrorCode.STRING_INVALID_URL]:   "رابط URL غير صالح",
  [LoydErrorCode.NUMBER_TOO_SMALL]:     ({ min, inclusive }) => `يجب أن يكون ${inclusive ? ">=" : ">"} ${min}`,
  [LoydErrorCode.NUMBER_TOO_LARGE]:     ({ max, inclusive }) => `يجب أن يكون ${inclusive ? "<=" : "<"} ${max}`,
  [LoydErrorCode.NUMBER_NOT_INTEGER]:   "يجب أن يكون عددًا صحيحًا",
  [LoydErrorCode.ARRAY_TOO_SHORT]:      ({ min }) => `مطلوب ${min} عنصر على الأقل`,
  [LoydErrorCode.UNION_NO_MATCH]:       "القيمة لا تتطابق مع أي نوع مسموح به",
};
