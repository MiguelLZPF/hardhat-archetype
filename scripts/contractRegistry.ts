export const VERSION_HEX_STRING_ZERO = new Uint8Array(2);

export const versionHexStringToDot = async (versionHexString: string) => {
  return `${versionHexString.substring(2, 4)}.${versionHexString.substring(4, 6)}`;
};

export const versionDotToHexString = async (versionDot: string) => {
  return `0x${versionDot.substring(0, 2)}${versionDot.substring(3, 5)}`;
};
