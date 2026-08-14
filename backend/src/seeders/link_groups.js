const { StudentGroup, Specialty } = require('../models');

async function updateGroupSpecialties() {
  try {
    const stomatologiya = await Specialty.findOne({ where: { name: 'Stomatologiya' } });
    if (stomatologiya) {
      await StudentGroup.update({ specialty_id: stomatologiya.id }, { where: {} });
      console.log('Groups linked to Stomatologiya specialty successfully!');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateGroupSpecialties();
