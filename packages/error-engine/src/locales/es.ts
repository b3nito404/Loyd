import type { MessageMap } from "../formatter.js";
import { LoydErrorCode } from "../codes.js";

export const es: MessageMap = {
  [LoydErrorCode.REQUIRED]:             "Este campo es obligatorio",
  [LoydErrorCode.INVALID_TYPE]:         ({ expected, received }) => `Se esperaba ${expected}, se recibió ${received}`,
  [LoydErrorCode.STRING_TOO_SHORT]:     ({ min, actual }) => `Mínimo ${min} caracteres (recibido: ${actual})`,
  [LoydErrorCode.STRING_TOO_LONG]:      ({ max, actual }) => `Máximo ${max} caracteres (recibido: ${actual})`,
  [LoydErrorCode.STRING_INVALID_EMAIL]: "Correo electrónico inválido",
  [LoydErrorCode.STRING_INVALID_URL]:   "URL inválida",
  [LoydErrorCode.NUMBER_TOO_SMALL]:     ({ min, inclusive }) => `Debe ser ${inclusive ? ">=" : ">"} ${min}`,
  [LoydErrorCode.NUMBER_TOO_LARGE]:     ({ max, inclusive }) => `Debe ser ${inclusive ? "<=" : "<"} ${max}`,
  [LoydErrorCode.NUMBER_NOT_INTEGER]:   "Debe ser un número entero",
  [LoydErrorCode.ARRAY_TOO_SHORT]:      ({ min }) => `Se requieren al menos ${min} elemento(s)`,
  [LoydErrorCode.UNION_NO_MATCH]:       "El valor no coincide con ningún tipo permitido",
};
