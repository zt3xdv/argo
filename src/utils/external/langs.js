const response = await fetch("https://translate.googleapis.com/translate_a/l?client=webapp&format=html");

if (!response.ok) {
  throw new Error(`Failed to fetch languages: ${response.status}`);
}

const { sl = {}, tl = {} } = await response.json();

const languages = Object.entries({
  ...sl,
  ...tl,
  auto: "Detect language",
})
  .map(([value, name]) => ({ name, value }))
  .sort((a, b) => a.name.localeCompare(b.name));

export { languages };
