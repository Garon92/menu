import { describe, expect, it } from 'vitest';
import { countLabel, greeting, plural, vocative } from '../kit/cz';

describe('cz helpers', () => {
  it.each([
    ['Adámek', 'Adámku'],
    ['Adam', 'Adame'],
    ['David', 'Davide'],
    ['Petr', 'Petře'],
    ['Pavel', 'Pavle'],
    ['Karel', 'Karle'],
    ['Daniel', 'Danieli'],
    ['Samuel', 'Samueli'],
    ['Marcel', 'Marceli'],
    ['Tomáš', 'Tomáši'],
    ['Lukáš', 'Lukáši'],
    ['Matěj', 'Matěji'],
    ['Ondřej', 'Ondřeji'],
    ['Dominik', 'Dominiku'],
    ['Vojtěch', 'Vojtěchu'],
    ['Oldřich', 'Oldřichu'],
    ['Honza', 'Honzo'],
    ['Kuba', 'Kubo'],
    ['Jirka', 'Jirko'],
    ['Marek', 'Marku'],
    ['Radek', 'Radku'],
    ['Vašek', 'Vašku'],
    ['Zdeněk', 'Zdeňku'],
    ['Luděk', 'Luďku'],
    ['Hyněk', 'Hyňku'],
    ['Jan', 'Jane'],
    ['Filip', 'Filipe'],
    ['Jakub', 'Jakube'],
    ['Šimon', 'Šimone'],
    ['Martin', 'Martine'],
    ['Štěpán', 'Štěpáne'],
    ['Viktor', 'Viktore'],
    ['Vladimír', 'Vladimíre'],
    ['Alexandr', 'Alexandře'],
    ['Kryštof', 'Kryštofe'],
    ['Josef', 'Josefe'],
    ['Max', 'Maxi'],
    ['Felix', 'Felixi'],
    ['Bartoloměj', 'Bartoloměji'],
    ['Jiří', 'Jiří'],
    ['René', 'René'],
    ['Hugo', 'Hugo'],
    ['Ema', 'Emo'],
    ['Anna', 'Anno'],
    ['Eliška', 'Eliško'],
    ['Tereza', 'Terezo'],
    ['Adéla', 'Adélo'],
    ['Marie', 'Marie'],
    ['Lucie', 'Lucie'],
    ['Natálie', 'Natálie'],
    ['Zoe', 'Zoe'],
    ['Noemi', 'Noemi'],
    ['Ester', 'Ester'],
    ['Rút', 'Rút'],
    ['Miriam', 'Miriam'],
    ['Dagmar', 'Dagmar'],
    ['Karin', 'Karin'],
    ['Nikol', 'Nikol'],
    ['Adámku', 'Adámku'],
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
    expect(greeting('', new Date(2026, 0, 1, 23))).toBe('Dobrý večer!');
    expect(greeting('Ema', new Date(2026, 0, 1, 2))).toBe('Ahoj, Emo!');
    for (let h = 0; h < 24; h++) expect(greeting('', new Date(2026, 0, 1, h))).not.toMatch(/noc/i);
  });
});
