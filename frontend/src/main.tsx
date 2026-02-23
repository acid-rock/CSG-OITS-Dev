import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Homepage from './route/homepage/App.js';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Root from './root-layout/Root-layout.js';
import Officers from './route/officers/Officers.js';
import Bulletin from './route/bulletin/Bulletin.js';

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        path: '/',
        element: <Homepage />,
      },
      {
        path: 'officers',
        element: <Officers />,
      },
      {
        path: 'bulletin',
        element: <Bulletin />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
