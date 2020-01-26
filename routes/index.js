var express = require('express');
var router = express.Router();
const path = require('path');
const fs = require('fs');

/* GET home page. */
router.get('/homebrew', function(req, res, next) {
  const pathToFile = path.join(__dirname, '..', 'resources', 'homebrew', req.query.type, `${req.query.name}.json`);
  fs.readFile(pathToFile, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send(data);
  });
});

router.get('/spells', function(req, res, next) {
  const pathToFile = path.join(__dirname, '..', 'resources', 'spells.json');
  fs.readFile(pathToFile, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    }
    try {
      const spellDetails = JSON.parse(data);
      const { classes, sources, spell_schools } = spellDetails;
      const spellsByLevel = getSpellsByLevel(spellDetails.spells);
      res.send({spellsByLevel, classes, sources, spell_schools});
    } catch (error) {
      return res.status(500).send(err);
    }
  });
});
router.post('/spells/filter', function(req, res, next) {
  const pathToFile = path.join(__dirname, '..', 'resources', 'spells.json');
  const filters = req.body;
  fs.readFile(pathToFile, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    }
    try {
      const spellDetails = JSON.parse(data);
      const { classes, sources, spell_schools, spells } = spellDetails;

      let filteredSpells = spells;

      if (filters.class) {
        const classSpellIds = classes.find(e => e.id === filters.class).spells_ids;
        filteredSpells = filteredSpells.filter(e => classSpellIds.includes(e.id));
      }
      if (filters.name) {
        filteredSpells = filteredSpells.filter(e => e.name.toLowerCase().includes(filters.name.toLowerCase()));
      }

      if (filters.levels) {
        filteredSpells = filteredSpells.filter(e => filters.levels.includes(e.level));
      }

      res.send(getSpellsByLevel(filteredSpells));
    } catch (error) {
      return res.status(500).send(err);
    }
  });
});

router.post('/spells', (req, res) => {
  const id = req.body.id;

  const pathToFile = path.join(__dirname, '..', 'resources', 'spells.json');

  fs.readFile(pathToFile, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    }
    try {
      const spellDetails = JSON.parse(data);
      const { classes, sources, spell_schools, spells } = spellDetails;
      const spell = spells.find(e => e.id === id);
      spell.spellSchool = spellSchool(spell_schools, spell.spell_school_id);
      spell.classes = spellClasses(classes, spell.id);
      spell.spellSources = spellSources(sources, spell.sources_rels)
      res.send(spell);
    } catch (error) {
      return res.status(500).send(err);
    }
  });
});

function getSpellsByLevel(spells) {
  const spellsByLevel = [[],[],[],[],[],[],[],[],[],[]];
  spells.forEach(spell => {
    spellsByLevel[spell.level].push({name: spell.name, id: spell.id});
  });
  spellsByLevel.forEach((spellLevel) => {
    spellLevel.sort((a, b) => a.name > b.name ? 1 : -1)
  });
  return spellsByLevel;
}

function spellSchool(spell_schools, id) {
  return spell_schools.find(item => id === item.id).name.replace(
      /\w\S*/g,
      function(txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
  );
}

function spellClasses(classes, id) {
  const found = classes.filter(e => e.spells_ids.includes(id));
  return found.map(e => e.name.replace(
      /\w\S*/g,
      function(txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
  )).join(', ');
}

function spellSources(sources, rels) {
  return rels.map(e => {
    const source = sources.find(s => s.id === e.source_id);
    return `${source.name} page ${e.page}`
  }).join(', ');
}

module.exports = router;
