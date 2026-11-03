export interface InstrumentSelection {
  timbre: string;
  reason: string;
  strength: string;
  challenge: string;
  setup: string;
  tags: string[];
  access: 'common' | 'specialist' | 'institution';
  portability: 'pocket' | 'carry' | 'large';
  practice: 'headphones' | 'soft' | 'audible' | 'loud';
  start: 'approachable' | 'guided' | 'specialist' | 'research';
}
