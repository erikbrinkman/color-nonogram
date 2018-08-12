
((exports) => {
  /**
     * Parse a string constraint into a constraint array
     *
     * A constraint string is a set of numbers followed by a non digit to represent
     * the number of that digit, or a space to indicate an arbitrary amount of
     * spaces. When followed by a space, the character after a number can be
     * omitted to use the default '█'.
     *
     * @example
     * nonogram.parseConstraint('1 3 1')
     *
     * @example
     * nonogram.parseConstraint('2.2@2. 2@')
     *
     * @param {string} parse - The constraint string.
     * @return {constraint}
     */
  exports.parseConstraint = (parse) => {
    const cs = [];
    while (parse) {
      const match = parse.match(/^( +|\d+[^\d +]?)/);
      if (!match) {
        throw new Error(`${parse} is improper format`);
      } else {
        let spec = match[0];
        parse = parse.slice(spec.length);
        if (spec.split('').every(c => c === ' ')) {
          cs.push({ char: ' ', count: 1, multi: true });
        } else {
          const last = spec.slice(-1);
          const isdig = last >= '0' && last <= '9';
          const char = isdig ? '█' : last;
          if (!isdig) {
            spec = spec.slice(0, -1);
          }
          cs.push({ char, count: parseInt(spec, 10) });
        }
      }
    }
    return cs;
  };

  /**
     * Format a constraint as a string
     *
     * This is the opposite of `parseConstraint` and will attempt to invert the
     * relation. Due to shortcuts in constraint strings, some constraints can't be
     * represented as strings, and several strings can represent the same
     * constraint.
     *
     * @example
     * nonogram.formatConstraint([
     *   {char: '█', count: 3},
     *   {char: ' ', count: 1, multi: true},
     *   {char: '█', count: 2}])
     *
     * @param {constraint} cons - The constraint array
     * @return {string}
     */
  exports.formatConstraint = cons => cons.map((c) => {
    if (c.char === ' ') {
      if (!c.multi || c.count !== 1) {
        throw new Error("string formats don't allow variable single spaces");
      }
      return ' ';
    } else {
      if (c.multi) {
        throw new Error("string formats don't allow variable length colors");
      }
      return c.count + c.char;
    }
  }).join('');

  function constraintsHold(char, cons, remaining) {
    let valHolds = false;
    for (let i = cons.length - 1; i >= 0; i -= 1) {
      const c = cons[i];
      if (valHolds) {
        remaining -= Math.max(c.count, 0);
      } else if (c.char === char) {
        valHolds = true;
        remaining -= Math.max(c.count - 1, 0);
      } else if (c.count > 0) {
        return false;
      }
    }
    return valHolds && remaining >= 0;
  }

  function normalizeConstraints(chars, charIndex, cons) {
    const count = { ' ': [0, true] };
    return [cons.map((con) => {
      con = con.map((c) => {
        if (!(c.char in charIndex)) {
          charIndex[c.char] = chars.push(c.char) - 1;
        }
        const cnt = (count[c.char] || (count[c.char] = [0, false]));
        cnt[0] += c.count;
        cnt[1] = cnt[1] || c.multi;
        return Object.assign({}, c); // Copy
      });
      if (!con.slice(1).every((c, i) => c.char !== con[i].char)) {
        throw new Error(`constraints can't have consecutive duplicate characters: ${JSON.stringify(con)}`);
      }
      if (!con.length || con[0].char !== ' ') {
        con.unshift({ char: ' ', count: 0, multi: true });
      } else {
        con[0].multi = true;
      }
      if (con[con.length - 1].char !== ' ') {
        con.push({ char: ' ', count: 0, multi: true });
      } else {
        con[con.length - 1].multi = true;
      }
      return con;
    }), count];
  }

  /**
   * Verify that counts of a character in rows are compatible with counts of a
   * character in columns and vice versa.
   */
  function verifyCounts(rowCount, colCount) {
    // Unmentioned keys have zero counts and are bounded
    Object.keys(rowCount).forEach(k => colCount[k] || (colCount[k] = [0, false]));
    Object.keys(colCount).forEach(k => rowCount[k] || (rowCount[k] = [0, false]));
    const keys = Object.keys(rowCount);
    if (!keys.every(k => (
      rowCount[k][1] && colCount[k][1])
      || (colCount[k][1] && colCount[k][0] <= rowCount[k][0])
      || (rowCount[k][1] && rowCount[k][0] <= colCount[k][0])
      || (rowCount[k][0] === colCount[k][0]))) {
      throw new Error(`rows and columns had different counts of characters. row: ${JSON.stringify(keys.reduce((o, k) => { o[k] = rowCount[k][0] + (rowCount[k][1] ? '+' : ''); return o; }, {}))}, cols: ${JSON.stringify(keys.reduce((o, k) => { o[k] = colCount[k][0] + (colCount[k][1] ? '+' : ''); return o; }, {}))}`);
    }
  }

  /**
   * Verify that the number of characters in each row (column) is less than the
   * number of columns (rows).
   */
  function verifyNums(constraints, num, current, other) {
    constraints.forEach((cons, i) => {
      if (Object.keys(cons).reduce((s, k) => s + cons[k].count, 0) > num) {
        throw new Error(`${current} ${i + 1} had more characters than the number of ${other}s (${num})`);
      }
    });
  }

  /**
   * Solve a nonogram
   *
   * @example
   * const img = nonogram.solve(['1', ''].map(nonogram.parseConstraint),
   *                            ['1', ''].map(nonogram.parseConstraint));
   * console.log(img.map(l => l.join('')).join('\n'));
   *
   * @param {constraints} rowConsInit - An array of the row constraints.
   * @param {constraints} colConsInit - An array of the column constraints.
   * @return {raster}
   */
  exports.solve = (rowConsInit, colConsInit) => {
    const rows = rowConsInit.length;
    const cols = colConsInit.length;
    const size = rows * cols;
    const chars = [' '];
    const charIndex = { ' ': 0 };

    const [rowCons, rowCounts] = normalizeConstraints(chars, charIndex, rowConsInit);
    const [colCons, colCounts] = normalizeConstraints(chars, charIndex, colConsInit);
    verifyNums(rowCons, colCons.length, 'row', 'column');
    verifyNums(colCons, rowCons.length, 'column', 'row');
    verifyCounts(rowCounts, colCounts);

    // Initialize raster
    const raster = Array(rows).fill(null).map(() => Array(cols).fill(null).map(() => ({ char: ' ', rc: [], cc: [] })));
    let i = size - 1;
    while (i >= 0) {
      let r = Math.trunc(i / cols);
      let c = i % cols;
      let rCons = rowCons[r];
      let cCons = colCons[c];
      let elem = raster[r][c];

      if (!elem.char && i + 1 === size) {
        // No solutions
        throw new Error('no solutions found');
      } else if (!elem.char) {
        // Finished all values, none satisfy
        elem.char = ' ';
        i += 1;
        r = Math.trunc(i / cols);
        c = i % cols;
        rCons = rowCons[r];
        cCons = colCons[c];
        elem = raster[r][c];

        // Unwind constraints for previous square
        if (rCons[rCons.length - 1].char === elem.char) {
          rCons[rCons.length - 1].count += 1;
        } else {
          elem.rc[elem.rc.length - 1].count += 1;
        }
        while (elem.rc.length) {
          rCons.push(elem.rc.pop());
        }

        if (cCons[cCons.length - 1].char === elem.char) {
          cCons[cCons.length - 1].count += 1;
        } else {
          elem.cc[elem.cc.length - 1].count += 1;
        }
        while (elem.cc.length) {
          cCons.push(elem.cc.pop());
        }

        elem.char = chars[charIndex[elem.char] + 1];
      } else if (constraintsHold(elem.char, cCons, r) && constraintsHold(elem.char, rCons, c)) {
        // Constrains can be satisfied, remove element from constraints
        while (rCons[rCons.length - 1].char !== elem.char) {
          elem.rc.push(rCons.pop());
        }
        rCons[rCons.length - 1].count -= 1;
        if (!rCons[rCons.length - 1].count && !rCons[rCons.length - 1].multi) {
          elem.rc.push(rCons.pop());
        }

        while (cCons[cCons.length - 1].char !== elem.char) {
          elem.cc.push(cCons.pop());
        }
        cCons[cCons.length - 1].count -= 1;
        if (!cCons[cCons.length - 1].count && !cCons[cCons.length - 1].multi) {
          elem.cc.push(cCons.pop());
        }

        i -= 1;
      } else {
        // Constraints not satisfied, but more more possible chars
        elem.char = chars[charIndex[elem.char] + 1];
      }
    }

    return raster.map(row => row.map(e => e.char));
  };

  /**
     * Unsolve a nonogram
     *
     * Takes a raster (2d array of chars) and converts it into row and column
     * constraints. Because the flexible constraints can't be inferred, this will
     * produce deterministic constraints without any wiggle room with spaces for
     * example. If so desired, one could easily post-process to this format.
     *
     * @example
     * const [rows, cols] = nonogram.unsolve([['█', ' '], [' ', ' ']]);
     *
     * @param {raster} image - The image to decompose into constraints.
     * @return {constraints} two element array of row and column constraints
     */
  exports.unsolve = (image) => {
    const rowCons = image.map(() => []);
    const colCons = image[0].map(() => []);
    image.forEach((row, r) => {
      const rCon = rowCons[r];
      row.forEach((char, c) => {
        const cCon = colCons[c];
        if (rCon.length && rCon[rCon.length - 1].char === char) {
          rCon[rCon.length - 1].count += 1;
        } else {
          rCon.push({ char, count: 1 });
        }
        if (cCon.length && cCon[cCon.length - 1].char === char) {
          cCon[cCon.length - 1].count += 1;
        } else {
          cCon.push({ char, count: 1 });
        }
      });
    });
    return [rowCons, colCons];
  };
})(typeof exports === 'undefined' ? this.nonogram = {} : exports);
