#!/usr/bin/env node
import { createSite, TEMPLATES } from '../src/create.js';
import { installUI, UI_COMPONENTS } from '../src/install-ui.js';
const help = 'Uyghur Starters / ئۇيغۇرچە باشلاش قېلىپلىرى\n\n' +
  'Usage:\n  create-uyghur --list\n  create-uyghur --template blog --dir ./my-site\n  create-uyghur --ui-list\n  create-uyghur --ui writing-field --dir ./my-ui\n\n' +
  'Templates: ' + TEMPLATES.join(', ') + '\n' +
  'UI blocks: ' + UI_COMPONENTS.join(', ') + '\n' +
  'Copies standalone files only. No install, build, network request, or shell command is run.\n' +
  'Use a new relative output directory; existing paths and traversal are refused.\n';
function parse(args) {
  const options={};
  for (let index=0;index<args.length;index++) {
    const flag=args[index];
    if (['--help','-h','--list','--ui-list'].includes(flag)) {
      const key=flag === '-h' ? '--help' : flag;
      if (options[key]) throw new Error('Duplicate option: ' + flag);
      options[key]=true;
    } else if (['--template','--dir','--ui'].includes(flag)) {
      if (options[flag] !== undefined) throw new Error('Duplicate option: ' + flag);
      const value=args[++index];
      if (!value || value.startsWith('--')) throw new Error('Missing value for ' + flag);
      options[flag]=value;
    } else throw new Error('Unknown argument: ' + flag);
  }
  return options;
}
try {
  const args=process.argv.slice(2), options=parse(args);
  if (!args.length || options['--help']) {
    if (options['--help'] && Object.keys(options).length > 1) throw new Error('--help must be used alone.');
    process.stdout.write(help);
  } else if (options['--list']) {
    if (Object.keys(options).length !== 1) throw new Error('--list must be used alone.');
    process.stdout.write(TEMPLATES.join('\n') + '\n');
  } else if (options['--ui-list']) {
    if (Object.keys(options).length !== 1) throw new Error('--ui-list must be used alone.');
    process.stdout.write(UI_COMPONENTS.join('\n') + '\n');
  } else if (options['--ui']) {
    if (options['--template'] || !options['--dir'] || Object.keys(options).length !== 2) throw new Error('Use --ui <component> with --dir <new-relative-folder> only.');
    const result=await installUI({component:options['--ui'],dir:options['--dir']});
    process.stdout.write('Installed Uyghur UI ' + result.component + ' at ' + result.directory + '\n\n' +
      'Next: open the new directory and run:\n  node server.mjs\n\n' +
      'Source files and CSS are bundled. No package install or network request was performed.\n' +
      'ئۇيغۇرچە UI ھۆججەتلىرى تەييار. README.md نى ئوقۇڭ.\n');
  } else {
    if (!options['--template'] || !options['--dir']) throw new Error('Both --template and --dir are required. Use --help.');
    const result=await createSite({template:options['--template'],dir:options['--dir']});
    process.stdout.write('Created ' + result.template + ' at ' + result.directory + '\n\n' +
      'Next: open the new directory and run:\n  node server.mjs\n\n' +
      'Then visit the printed local address. Edit data.json and README.md to make it yours.\n' +
      'ھۆججەتلەر تەييار. ئۈلگە مەزمۇننى ئۆز مەزمۇنىڭىز بىلەن ئالماشتۇرۇڭ.\n');
  }
} catch (error) { process.stderr.write('Error: ' + error.message + '\n'); process.exitCode=2; }
