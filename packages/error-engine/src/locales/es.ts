import { LoydErrorCode } from "../codes.js";
import type { MessageMap } from "../formatter.js";
export const es: MessageMap = {
  [LoydErrorCode.REQUIRED]: "Este campo es obligatorio",
  [LoydErrorCode.STRING_INVALID_EMAIL]: "Correo electrónico inválido",
  [LoydErrorCode.NUMBER_NOT_INTEGER]: "Debe ser un número entero",
};
