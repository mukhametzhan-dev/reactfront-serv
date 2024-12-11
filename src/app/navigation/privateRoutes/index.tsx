import { Outlet } from 'react-router-dom';
import { AppSuspense } from '../../../shared/components/AppSuspense/AppSuspense';
import { ProtectedRoute } from '../../../shared/components/ProtectedRoute/ProtectedRoute';
import { AppLayout } from '../../../shared/layouts/AppLayout/AppLayout';
import { privateRoutesMap } from '../../../shared/navigation';
import React from 'react';
import { Profile } from '../../../pages/Profile/Profile';
import { Schedule } from '../../../pages/Schedule/Schedule';
import Manage from '../../../pages/Manage/Manage';
// 
import { Appointment } from '../../../pages/Appointment/Appointment';
import { Appointments } from '../../../pages/Appointments/Appointments';
import MyAppointments from '../../../pages/MyAppointments/MyAppointments';
import AdminInsertion from '../../../pages/AdminInsertion/AdminInsertion';
import MedicalHistory from '../../../pages/MedicalHistory/MedicalHistory';
import Transactions from '../../../pages/Transactions/Transactions';
import path from 'path';
import Support from '../../../pages/Support/Support';
export const privateRoutes = [
  {
    element: (
      <ProtectedRoute>
        <AppLayout>
          <AppSuspense>
            <Outlet />
          </AppSuspense>
        </AppLayout>
      </ProtectedRoute>
    ),
    children: [
      {
        path: privateRoutesMap.home,
        element: <Profile />,
      },
      {
        path: privateRoutesMap.schedule,
        element: <Schedule />,
      },
      {
        path: privateRoutesMap.manage,
        element: <Manage />,
      },
      {
        path: privateRoutesMap.appointment,
        element: <Appointment />,
      },
      {
        path: privateRoutesMap.appointments,
        element: <Appointments />,

      },
     {
      path: privateRoutesMap.myapps,
      element: <MyAppointments />,
     } ,
     {
      path:privateRoutesMap.admininsertion,
      element: <AdminInsertion />,

     },
     {
      path:privateRoutesMap.medhistory,
      element: <MedicalHistory />,
     },
     {
      path:privateRoutesMap.transactions,
      element: <Transactions />,

     },
     {
      path:privateRoutesMap.support,
      element: <Support />,

     }

      
    ],
  },
];