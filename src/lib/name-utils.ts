/**
 * Split full name into first name and last name
 * 
 * Examples:
 *   "Anna" → { firstName: "Anna", lastName: "" }
 *   "Anna Kowalska" → { firstName: "Anna", lastName: "Kowalska" }
 *   "Jan Maria Nowak" → { firstName: "Jan", lastName: "Maria Nowak" }
 */
export function splitFullName(fullName: string): { 
  firstName: string; 
  lastName: string 
} {
  const trimmed = fullName.trim();
  
  if (!trimmed) {
    return { firstName: '', lastName: '' };
  }
  
  const parts = trimmed.split(/\s+/); // split by any whitespace
  
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  
  // First word = first name, rest = last name
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  
  return { firstName, lastName };
}
