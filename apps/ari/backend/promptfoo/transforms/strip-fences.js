// Strip markdown code fences from LLM output (mirrors production extract_json behavior)
module.exports = (output) => {
  let t = output.trim();
  if (t.startsWith('```json')) t = t.slice(7);
  else if (t.startsWith('```')) t = t.slice(3);
  if (t.endsWith('```')) t = t.slice(0, -3);
  return t.trim();
};
