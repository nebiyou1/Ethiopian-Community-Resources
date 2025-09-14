const fs = require('fs');
const path = require('path');

// Load the data
const dataPath = path.join(__dirname, '../docs/inputdata.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(rawData);

console.log(`📊 Original data: ${data.programs.length} programs`);

// Data quality filters
const isValidProgram = (program) => {
  // Must have a valid program name
  if (!program.program_name || 
      program.program_name.trim() === '' || 
      program.program_name.toLowerCase().includes('unknown') ||
      program.program_name.toLowerCase().includes('n/a') ||
      program.program_name.toLowerCase().includes('tbd') ||
      program.program_name.toLowerCase().includes('to be determined')) {
    return false;
  }

  // Must have a valid cost category
  if (!program.cost_category || 
      program.cost_category.trim() === '' ||
      program.cost_category.toLowerCase().includes('unknown') ||
      program.cost_category.toLowerCase().includes('n/a')) {
    return false;
  }

  // Must have a valid grade level (numeric)
  if (!program.grade_level || 
      isNaN(program.grade_level) || 
      program.grade_level < 9 || 
      program.grade_level > 12) {
    return false;
  }

  // Must have a valid program type
  if (!program.program_type || 
      program.program_type.trim() === '' ||
      program.program_type.toLowerCase().includes('unknown') ||
      program.program_type.toLowerCase().includes('n/a')) {
    return false;
  }

  // Must have a valid subject area
  if (!program.subject_area || 
      program.subject_area.trim() === '' ||
      program.subject_area.toLowerCase().includes('unknown') ||
      program.subject_area.toLowerCase().includes('n/a')) {
    return false;
  }

  return true;
};

// Clean and validate programs
const cleanedPrograms = data.programs.filter(isValidProgram);

console.log(`🧹 After cleaning: ${cleanedPrograms.length} programs`);
console.log(`❌ Removed: ${data.programs.length - cleanedPrograms.length} invalid programs`);

// Show what was removed
const removedPrograms = data.programs.filter(p => !isValidProgram(p));
if (removedPrograms.length > 0) {
  console.log('\n🚫 Removed programs:');
  removedPrograms.forEach(program => {
    console.log(`  - ID ${program.id}: "${program.program_name}" (${program.cost_category || 'no cost'})`);
  });
}

// Update the data
data.programs = cleanedPrograms;
data.metadata.total_programs = cleanedPrograms.length;
data.metadata.last_updated = new Date().toISOString();

// Create backup
const backupPath = path.join(__dirname, '../docs/inputdata-backup.json');
fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
console.log(`💾 Backup created: ${backupPath}`);

// Write cleaned data
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`✅ Cleaned data written to: ${dataPath}`);

// Show statistics
const stats = {
  total: cleanedPrograms.length,
  byCost: {},
  byType: {},
  byGrade: {}
};

cleanedPrograms.forEach(program => {
  // Cost category stats
  stats.byCost[program.cost_category] = (stats.byCost[program.cost_category] || 0) + 1;
  
  // Program type stats
  stats.byType[program.program_type] = (stats.byType[program.program_type] || 0) + 1;
  
  // Grade level stats
  stats.byGrade[program.grade_level] = (stats.byGrade[program.grade_level] || 0) + 1;
});

console.log('\n📈 Cleaned Data Statistics:');
console.log('Cost Categories:', stats.byCost);
console.log('Program Types:', stats.byType);
console.log('Grade Levels:', stats.byGrade);
