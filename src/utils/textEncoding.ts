const MOJIBAKE_HINT_PATTERN = /[ÃÂÅÆÇÐÑØÙÚÛÜÝÞßæçéêëîïðñòóôõöøùúûüýþÿ□■]/;

export function looksLikeMojibake(value: string) {
  return MOJIBAKE_HINT_PATTERN.test(value) || value.includes("�");
}

function tryDecodeUtf8FromLatin1(value: string) {
  try {
    const bytes = Uint8Array.from(Array.from(value).map((char) => char.charCodeAt(0) & 0xff));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return value;
  }
}

export function repairMojibakeText(value: string) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || !looksLikeMojibake(trimmed)) {
    return trimmed;
  }

  const decoded = tryDecodeUtf8FromLatin1(trimmed).trim();
  return decoded || trimmed;
}
