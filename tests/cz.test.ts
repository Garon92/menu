import { describe, expect, it } from 'vitest';
import { countLabel, greeting, plural, vocative } from '../kit/cz';

describe('cz helpers', () => {
  it.each([
    ['Adámek', 'Adámku'],
    ['Adam', 'Adame'],
    ['David', 'Davide'],
    ['Petr', 'Petře'],
    ['Pavel', 'Pavle'],
    ['Daniel', 'Danieli'],
    ['Tomáš', 'Tomáši'],
    ['Matěj', 'Matěji'],
    ['Dominik', 'Dominiku'],
    ['Vojtěch', 'Vojtěchu'],
    ['Honza', 'Honzo'],
    ['Ema', 'Emo'],
    ['Marie', 'Marie'],
    ['Jiří', 'Jiří'],
    ['Adámku', 'Adámku'],
    ['Marek', 'Marku'],
    ['Max', 'Maxi'],
    ['Anna Nová', 'Anna Nová'],
  ])('vocative(%s) = %s', (n, v) => expect(vocative(n)).toBe(v));

  it('plural + countLabel', () => {
    expect(plural(1, 'bod', 'body', 'bodů')).toBe('bod');
    expect(plural(3, 'bod', 'body', 'bodů')).toBe('body');
    expect(plural(5, 'bod', 'body', 'bodů')).toBe('bodů');
    expect(plural(0, 'bod', 'body', 'bodů')).toBe('bodů');
    expect(countLabel(1200, 'bod', 'body', 'bodů')).toMatch(/^1\s200 bodů$/);
  });

  it('greets by time of day', () => {
    expect(greeting('', new Date(2026, 0, 1, 7))).toBe('Dobré ráno!');
    expect(greeting('Adámek', new Date(2026, 0, 1, 15))).toBe('Dobré odpoledne, Adámku!');
    expect(greeting('', new Date(2026, 0, 1, 20))).toBe('Dobrý večer!');
    expect(greeting('', new Date(2026, 0, 1, 2))).toBe('Dobrou noc!');
  });
});
