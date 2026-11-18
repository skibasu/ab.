const POLISH_LETTERS = 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ';
const ASCII_LETTERS = 'acelnoszzACELNOSZZ';

/** Removes Polish diacritics while preserving the case of each letter. */
export function stripPolishDiacritics(value: string): string {
  return value
    .normalize('NFC')
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (letter) => ASCII_LETTERS[POLISH_LETTERS.indexOf(letter)]);
}
