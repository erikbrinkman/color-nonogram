'use strict';
const should = require('chai').should();
const nonogram = require('..');

function rast(string) {
    return string.join('').slice(1);
}

// FIXME Test assertions

describe('#parseConstraint()', () => {
    it('parses black and white', () => {
        nonogram.parseConstraint('1 3 2').should.deep.equal(
            [{char: '█', count: 1},
             {char: ' ', count: 1, multi: true},
             {char: '█', count: 3},
             {char: ' ', count: 1, multi: true},
             {char: '█', count: 2}]);
    });

    it('parses the empty string', () => {
        nonogram.parseConstraint('').should.deep.equal([]);
    });

    it('ignores double spaces', () => {
        nonogram.parseConstraint('1  3 2').should.deep.equal(
            [{char: '█', count: 1},
             {char: ' ', count: 1, multi: true},
             {char: '█', count: 3},
             {char: ' ', count: 1, multi: true},
             {char: '█', count: 2}]);
    });

    it('parses "color"', () => {
        nonogram.parseConstraint('1@ 3. 2/').should.deep.equal(
            [{char: '@', count: 1},
             {char: ' ', count: 1, multi: true},
             {char: '.', count: 3},
             {char: ' ', count: 1, multi: true},
             {char: '/', count: 2}]);
    });

    it('parses color without spaces and with black and white', () => {
        nonogram.parseConstraint('1█3. 2').should.deep.equal(
            [{char: '█', count: 1},
             {char: '.', count: 3},
             {char: ' ', count: 1, multi: true},
             {char: '█', count: 2}]);
    });

    it('parses double digits', () => {
        nonogram.parseConstraint('1█13. 2').should.deep.equal(
            [{char: '█', count: 1},
             {char: '.', count: 13},
             {char: ' ', count: 1, multi: true},
             {char: '█', count: 2}]);
    });

    it('throws an exception for bad format', () => {
        (() => nonogram.parseConstraint('##')).should.throw(Error);
    });
});


describe('#formatConstraint()', () => {
    it('formats standard', () => {
        nonogram.formatConstraint([{char: '█', count: 1},
                                   {char: ' ', count: 1, multi: true},
                                   {char: '█', count: 3},
                                   {char: ' ', count: 1, multi: true},
                                   {char: '█', count: 2}]).should.equal('1█ 3█ 2█');
    });

    it('formats without spaces and color', () => {
        nonogram.formatConstraint([{char: '█', count: 1},
                                   {char: '.', count: 3},
                                   {char: ' ', count: 1, multi: true},
                                   {char: '█', count: 2}]).should.equal('1█3. 2█');
    });

    it('is invertable', () => {
        const cons = [{char: '@', count: 1},
                      {char: '.', count: 3},
                      {char: ' ', count: 1, multi: true},
                      {char: '█', count: 2}]
        nonogram.parseConstraint(nonogram.formatConstraint(cons)).should.deep.equal(cons);
    });

    it('formats empty', () => {
        nonogram.formatConstraint([]).should.equal('');
    });

    it("can't format fixed spaces", () => {
        (() => nonogram.formatConstraint([{char: ' ', count: 1}])).should.throw(Error);
    });

    it("can't format several spaces", () => {
        (() => nonogram.formatConstraint([{char: ' ', count: 2, multi: true}])).should.throw(Error);
    });

    it("can't format multi characters", () => {
        (() => nonogram.formatConstraint([{char: '@', count: 1, multi: true}])).should.throw(Error);
    });
});


describe('#solve()', () => {
    it('should make solve E in black and white', () => {
        const rowCons = ['5', '1', '3', '1', '5'].map(nonogram.parseConstraint);
        const colCons = ['5', '1 1 1', '1 1 1', '1 1', '1 1'].map(nonogram.parseConstraint);
        const expected = rast`
█████
█    
███  
█    
█████`;
        nonogram.solve(rowCons, colCons).map(l => l.join('')).join('\n').should.equal(expected);
    });

    it('should solve cpc', () => {
        const rowCons = ['3B2L',
                         '2B4K1L 2L',
                         '2B4K4L2B',
                         '1B4K1L1B3L1B2G',
                         '2B2K4B2G2L2K1G 1B',
                         '3B1K4B1G2K1G2L1K1G 1B1Y',
                         '2B2K4B1G2K1G1B2L 1B1Y',
                         '2B2K5B2G3B2L 1B2Y',
                         '1K 2B4K10B2L2Y',
                         '1Y2K 3B5K10B1L2Y',
                         '3Y3K 7K3B1K5B1L1Y',
                         '5Y8K2B1K3B2K5B',
                         '6Y3O3K3B2K2B4K2G',
                         '8Y3O2K2B2K4B4K',
                         '7Y3O6K7B2K1B',
                         '4Y5K2B8L1B2L3B',
                         '2Y3K 2K1B1L2B1L1B1L1B1L1B1L1B1L3B',
                         '2K 1L1B2L2B1L3B2L3B',
                         '2B1K12B',
                         '1Y1K2L9B',
                         '2Y1K2L8B',
                         '1Y1K2L 8B',
                         '2Y1K1L 4B',
                         '2Y1K1L'].map(nonogram.parseConstraint);
        const colCons = ['1K6Y',
                         '1K7Y',
                         '1K7Y1K',
                         '1K5Y2K',
                         '1K5Y1K',
                         '2K3Y2K',
                         '1K1O2Y1K',
                         '1B 1K1O1Y1O1K',
                         '2B 1K3O2K',
                         '5B3K2O2K 1Y',
                         '4B5K1O1K2B 2Y',
                         '4B9K1B2L1B 3Y1K',
                         '2B9K1B2K1L3B2Y2K1L',
                         '2B3K3B3K3B1K1L1B1L3K2L',
                         '1B3K5B2K3B1K3L1B3L',
                         '1B3K6B5K1L3B2L',
                         '1L2K1L8B2K1B2L5B',
                         '1L1K1L2B2G8B1L1B1L4B',
                         '3L1G2K1G7B2L6B',
                         '2L1G2K1G2B3K2B1L7B',
                         '4L2G4B2K3B1L6B',
                         '1L2B2L6B2K1B1L1B1L5B',
                         '1B1G1K2L5B2K1B3L4B',
                         '1G2K2L4B1G2K7B',
                         '2G 2L3B1G2K5B',
                         '3L1B 5B',
                         '1B3Y',
                         '2B3Y',
                         '1B3Y'].map(nonogram.parseConstraint);
        const raster = nonogram.solve(rowCons, colCons).map(l => l.join('')).join('\n');
    }).timeout(5000);

    it('fails on duplicate characters', () => {
        (() => nonogram.solve(['1@1@'].map(nonogram.parseConstraint),
                              ['2@'].map(nonogram.parseConstraint))).should.throw(Error);
    });

    it('recognizes invalid counts', () => {
        (() => nonogram.solve(['1@'].map(nonogram.parseConstraint),
                              ['2@'].map(nonogram.parseConstraint))).should.throw(Error);
    });

    it('fails to solve impossible nonograms', () => {
        (() => nonogram.solve(['1', '2', '1'].map(nonogram.parseConstraint),
                              ['1', '', '3'].map(nonogram.parseConstraint))).should.throw(Error);
    });
});

describe('#desolve()', () => {
    it('should derive E constraints appropriately', () => {
        const expectedRowCons = [[{char: '█', count: 5}],
                                 [{char: '█', count: 1}, {char: ' ', count: 4}],
                                 [{char: '█', count: 3}, {char: ' ', count: 2}],
                                 [{char: '█', count: 1}, {char: ' ', count: 4}],
                                 [{char: '█', count: 5}]];
        const expectedColCons = [[{char: '█', count: 5}],
                                 [{char: '█', count: 1}, {char: ' ', count:1}, {char: '█', count: 1}, {char: ' ', count: 1}, {char: '█', count: 1}],
                                 [{char: '█', count: 1}, {char: ' ', count:1}, {char: '█', count: 1}, {char: ' ', count: 1}, {char: '█', count: 1}],
                                 [{char: '█', count: 1}, {char: ' ', count: 3}, {char: '█', count: 1}],
                                 [{char: '█', count: 1}, {char: ' ', count: 3}, {char: '█', count: 1}]];
        const raster = rast`
█████
█    
███  
█    
█████`;
        const [rowCons, colCons] = nonogram.unsolve(raster.split('\n').map(l => l.split('')));
        // The slices remove the leading and trailing spaces which are omitted for brevity
        rowCons.should.deep.equal(expectedRowCons);
        colCons.should.deep.equal(expectedColCons);
    });

    it('should be invertable', () => {
        const raster = rast`
█████
█    
███  
█    
█████`;
        const [rowCons, colCons] = nonogram.unsolve(raster.split('\n').map(l => l.split('')));
        nonogram.solve(rowCons, colCons).map(l => l.join('')).join('\n').should.equal(raster);
    });

    it('should still be hard invertable', () => {
        const raster = rast`
 ███
███ 
  ██`;
        const [rowCons, colCons] = nonogram.unsolve(raster.split('\n').map(l => l.split('')));
        nonogram.solve(rowCons, colCons).map(l => l.join('')).join('\n').should.equal(raster);
    });

    it('should be invertable for acorn', () => {
        const raster = rast`
    #     
    #     
   #@#@   
  #@#@##  
 #@#@#@## 
#@#@######
@#########
#@YYYYYY##
 YYYYYYYY 
 Y YYYYYY 
 Y YYYYYY 
 Y YYYYYY 
  Y YYYYY 
  YY YYY  
   YYYY   `;
        const [rowCons, colCons] = nonogram.unsolve(raster.split('\n').map(l => l.split('')));
        nonogram.solve(rowCons, colCons).map(l => l.join('')).join('\n').should.equal(raster);
    });
});
