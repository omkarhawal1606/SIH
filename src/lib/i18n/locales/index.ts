import { en, type Translations } from "./en";
import { hi } from "./hi";
import { mr } from "./mr";
import { bn } from "./bn";
import { gu } from "./gu";
import { ta } from "./ta";
import { te } from "./te";
import { kn } from "./kn";
import { ml } from "./ml";
import { pa } from "./pa";
import { or } from "./or";
import { as } from "./as";
import { type LanguageCode } from "../config";

export const LOCALES: Record<LanguageCode, Translations> = {
  en,
  hi,
  mr,
  bn,
  gu,
  ta,
  te,
  kn,
  ml,
  pa,
  or,
  as,
};

export { en, type Translations };
