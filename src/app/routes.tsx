import { createHashRouter } from 'react-router';
import { Root } from './components/Root';
import { HomePage } from './components/HomePage';
import { DocsPage } from './components/DocsPage';
import { ParticlesPage } from './components/ParticlesPage';
import { UniversePage } from './components/UniversePage';
import { WorldsPage } from './components/WorldsPage';
import { MagicPage } from './components/MagicPage';
import { MagicLabPage } from './components/MagicLabPage';
import { FingerThreadsPage } from './components/FingerThreadsPage';
import { BuildingPage } from './components/BuildingPage';

export const router = createHashRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true,            Component: HomePage         },
      { path: 'particles',      Component: ParticlesPage    },
      { path: 'universe',       Component: UniversePage     },
      { path: 'worlds',         Component: WorldsPage       },
      { path: 'magic',          Component: MagicPage        },
      { path: 'magic-lab',      Component: MagicLabPage     },
      { path: 'finger-threads', Component: FingerThreadsPage },
      { path: 'building',       Component: BuildingPage     },
      { path: 'docs',           Component: DocsPage         },
    ],
  },
]);
