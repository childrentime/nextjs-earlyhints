import type { BuildManifest } from 'next/dist/server/get-page-files';
import { getPageFiles } from 'next/dist/server/get-page-files';

interface DocumentFiles {
  sharedFiles: readonly string[];
  pageFiles: readonly string[];
  allFiles: readonly string[];
};

export function getDocumentFiles(
  buildManifest: BuildManifest,
  pathname: string,
  inAmpMode: boolean,
): DocumentFiles {
  const sharedFiles: readonly string[] = getPageFiles(buildManifest, '/_app');
  const pageFiles: readonly string[]
    = process.env.NEXT_RUNTIME !== 'edge' && inAmpMode
      ? []
      : getPageFiles(buildManifest, pathname);

  return {
    sharedFiles,
    pageFiles,
    allFiles: [...new Set([...sharedFiles, ...pageFiles])],
  };
}
