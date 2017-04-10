const colors = require('colors');
const nonogram = require('.');
const fs = require('fs');
const program = require('commander');

program
    .version('0.0.0')
    .usage('[options] [input]')
    .description('Solve colored and black & white  nonograms. Input is a json file with `rows` and `cols` where each is a list of constraints. Constraints are either strings like "4 3 1" for black and white nonograms, "4.2@" for colored nonograms where the number precedes the quantity of the character, or arrays of json objects like {char: "#", count: 3, multi: [ true | false ]} where multi indicates more than `count` of that character may be used (e.g. for spaces). The input file may also contain a `styles` attribute, where styles maps a character to a nodejs `colors` style (e.g. `black`, `underline`, `bgWhite`).')
    .option('--no-stretch', "don't duplicate each 'pixel'")
    .option('--no-color', 'disable colored output')
    .parse(process.argv);

if (program.args.length > 1) {
    console.error("\n  error: only one input file may be specified\n");
    process.exit(1);
}

/** Compresses an array into elements and counts. */
function count(elements) {
    return elements.reduce((l, e) => {
        if (!l.length || l[l.length - 1][0] !== e) {
            l.push([e, 1]);
        } else {
            l[l.length - 1][1] ++;
        }
        return l;
    }, []);
}

const data = JSON.parse(fs.readFileSync(program.args.length ? program.args[0] : process.stdin.fd));
const styleMap = data.styles || {};
const rows = data.rows.map(con => typeof con === 'string' ? nonogram.parseConstraint(con) : con);
const cols = data.cols.map(con => typeof con === 'string' ? nonogram.parseConstraint(con) : con);
const raster = nonogram.solve(rows, cols);
raster.forEach(line => {
    console.log(count(line).map(([e, c]) => {
        let run = Array(c * (program.stretch ? 2 : 1)).fill(e).join('');
        (styleMap[e] || []).forEach(style => {
            run = run[style];
            if (!run) {
                console.error(`\n  error: unknown style: ${style}\n`);
                process.exit(1);
            }
        });
        return run;
    }).join(''));
});
