/**
 * 用于生成 sdk 里的多语言，目前只有德语
 */

const fs = require('fs');

function generateSdkLocale(localeFile) {
  return localeFile
    .replace(`import {register} from '../locale';`, '')
    .replace('register(', `amisRequire('amis').registerLocale(`);
}

if (require.main === module) {
  try {
    const localeFile = fs.readFileSync(process.argv[2], 'utf8');
    console.log(generateSdkLocale(localeFile));
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
}

module.exports = {
  generateSdkLocale
};
