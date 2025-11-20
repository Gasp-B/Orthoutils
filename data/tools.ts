export type Tool = {
  id: string;
  name: string;
  description: string;
  category: 'Questionnaire' | 'Test standardisé' | 'Suivi patient';
  population: string;
  tags: string[];
  status: 'Validé' | 'En cours de revue' | 'Communauté';
};

export const tools: Tool[] = [
  {
    id: 'bdae',
    name: "Boston Diagnostic Aphasia Examination",
    description:
      "Évalue les troubles du langage chez les adultes avec modules d'expression, compréhension et lecture.",
    category: 'Test standardisé',
    population: 'Adultes',
    tags: ['aphasie', 'langage', 'diagnostic'],
    status: 'Validé',
  },
  {
    id: 'edo',
    name: "ELO - Évaluation du Langage Oral",
    description: "Questionnaire modulable pour le dépistage rapide chez l'enfant en cabinet ou à l'école.",
    category: 'Questionnaire',
    population: "Enfants 3-10 ans",
    tags: ['dépistage', 'langage oral'],
    status: 'En cours de revue',
  },
  {
    id: 'logico',
    name: 'LOGICO-Suivi',
    description:
      'Tableau de bord collaboratif pour suivre les plans de soins, notes de séances et exercices assignés.',
    category: 'Suivi patient',
    population: 'Tous publics',
    tags: ['suivi', 'collaboration', 'progression'],
    status: 'Communauté',
  },
];
