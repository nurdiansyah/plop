import * as fspp from "../fs-promise-proxy.js";

import {
  getRenderedTemplate,
  makeDestPath,
  throwStringifiedError,
  getRelativeToBasePath,
} from "./_common-action-utils.js";

import actionInterfaceTest from "./_common-action-interface-check.js";
import { escapeRegExp } from "../utils.js";

const doAppend = async function (data, cfg, plop, fileData) {
  const stringToAppend = await getRenderedTemplate(data, cfg, plop);
  // if the appended string should be unique (default),
  // remove any occurence of it (but only if pattern would match)

  const { separator = "\n" } = cfg;
  if (cfg.unique !== false) {
    // only remove after "pattern", so that we remove not too much accidentally
    const parts = fileData.split(cfg.pattern);
    let lastPart = parts[parts.length - 1];
    if (cfg.patternEnd) {
      const _parts = lastPart.split(cfg.patternEnd, 2);
      const _regexSlash = /\\/g;
      const _pattern = cfg.pattern.source || cfg.pattern;
      const _patternEnd = cfg.patternEnd.source || cfg.patternEnd;
      const _content = `${_pattern}${_parts[0]}${_parts[1] ? _patternEnd : ""}`;
      // batas akhir pencarian
      const _contentWithoutDuplicates = _parts[0].replace(
        new RegExp(separator + escapeRegExp(stringToAppend), "g"),
        ""
      );
      fileData = fileData.replace(
        new RegExp(`(${_pattern})(.*)(${_patternEnd})`, "gs"),
        `$1${_contentWithoutDuplicates}$3`
      );
    } else {
      const lastPartWithoutDuplicates = lastPart.replace(
        new RegExp(separator + stringToAppend, "g"),
        ""
      );
      fileData = fileData.replace(lastPart, lastPartWithoutDuplicates);
    }
  }

  // add the appended string to the end of the "fileData" if "pattern"
  // was not provided, i.e. null or false
  if (!cfg.pattern) {
    // make sure to add a "separator" if "fileData" is not empty
    if (fileData.length > 0) {
      fileData += separator;
    }
    return fileData + stringToAppend;
  }
  return fileData.replace(cfg.pattern, "$&" + separator + stringToAppend);
};

export default async function (data, cfg, plop) {
  const interfaceTestResult = actionInterfaceTest(cfg);
  if (interfaceTestResult !== true) {
    throw interfaceTestResult;
  }
  const fileDestPath = makeDestPath(data, cfg, plop);
  try {
    // check path
    const pathExists = await fspp.fileExists(fileDestPath);
    if (!pathExists) {
      throw "File does not exist";
    } else {
      let fileData = await fspp.readFile(fileDestPath);
      fileData = await doAppend(data, cfg, plop, fileData);
      await fspp.writeFile(fileDestPath, fileData);
    }
    return getRelativeToBasePath(fileDestPath, plop);
  } catch (err) {
    throwStringifiedError(err);
  }
}
