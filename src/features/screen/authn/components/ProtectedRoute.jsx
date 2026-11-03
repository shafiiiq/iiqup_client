import React from 'react';
import { Navigate } from 'react-router-dom';
import { hasStoredUserSession } from '@/features/core/device/storage/session/session.user';
import { AUTHN_ROUTES } from '../constants/authn.routes';

function ProtectedRoute({ children }) {
    if (!hasStoredUserSession()) return <Navigate to={AUTHN_ROUTES.AUTHN} replace />;
    return children;
}

export default ProtectedRoute;