# Role-Based Access Control (RBAC) System

This document explains how role-based access control is implemented in the Influencer Management application.

## Overview

The application supports two user roles:
- **Admin**: Full access to manage creators, campaigns, and system settings
- **Creator**: Access to submit deliverables, view campaigns, and track earnings

## Components

### 1. Route Protection Components

#### `ProtectedRoute`
- **Purpose**: Ensures user is authenticated before accessing a route
- **Usage**: Wrap any route that requires authentication
- **Example**:
```tsx
<Route element={
  <ProtectedRoute>
    <AppLayout />
  </ProtectedRoute>
}>
  {/* Protected routes go here */}
</Route>
```

#### `AdminOnlyRoute`
- **Purpose**: Only allows admin users to access a route
- **Usage**: Wrap admin-only routes
- **Example**:
```tsx
<Route path="/creators" element={
  <AdminOnlyRoute>
    <CreatorsManagement />
  </AdminOnlyRoute>
} />
```

#### `CreatorOnlyRoute`
- **Purpose**: Only allows creator users to access a route
- **Usage**: Wrap creator-only routes
- **Example**:
```tsx
<Route path="/my-deliverables" element={
  <CreatorOnlyRoute>
    <MyDeliverables />
  </CreatorOnlyRoute>
} />
```

#### `RoleBasedRoute`
- **Purpose**: Renders different components based on user role
- **Usage**: When you want different content for different roles
- **Example**:
```tsx
<RoleBasedRoute
  adminComponent={<AdminDashboard />}
  creatorComponent={<CreatorDashboard />}
/>
```

### 2. Content Components

#### `RoleBasedContent`
- **Purpose**: Renders different content within a page based on user role
- **Usage**: For showing/hiding elements within a page
- **Example**:
```tsx
<RoleBasedContent
  adminContent={<AdminPanel />}
  creatorContent={<CreatorPanel />}
  fallbackContent={<NoAccessMessage />}
/>
```

### 3. Hooks

#### `useRole`
- **Purpose**: Provides easy role checking utilities
- **Usage**: In any component that needs role information
- **Example**:
```tsx
const { user, isAdmin, isCreator, hasRole } = useRole();

if (isAdmin) {
  // Show admin features
}

if (hasRole(['admin', 'creator'])) {
  // Show features for both roles
}
```

## Implementation Examples

### 1. Route-Level Protection

```tsx
// App.tsx
<Routes>
  {/* Public routes */}
  <Route path="/signin" element={<SignIn />} />
  <Route path="/signup" element={<SignUp />} />
  
  {/* Protected routes */}
  <Route element={
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  }>
    {/* Role-based home */}
    <Route index path="/" element={<RoleBasedHome />} />
    
    {/* Admin-only routes */}
    <Route path="/creators" element={
      <AdminOnlyRoute>
        <CreatorsManagement />
      </AdminOnlyRoute>
    } />
    
    {/* Creator-only routes */}
    <Route path="/my-deliverables" element={
      <CreatorOnlyRoute>
        <MyDeliverables />
      </CreatorOnlyRoute>
    } />
    
    {/* Public authenticated routes */}
    <Route path="/profile" element={<UserProfiles />} />
  </Route>
</Routes>
```

### 2. Component-Level Protection

```tsx
// Example component with role-based content
function Dashboard() {
  const { isAdmin, isCreator } = useRole();
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Role-based content */}
      <RoleBasedContent
        adminContent={<AdminStats />}
        creatorContent={<CreatorStats />}
      />
      
      {/* Conditional rendering */}
      {isAdmin && <AdminActions />}
      {isCreator && <CreatorActions />}
      
      {/* Common content */}
      <CommonContent />
    </div>
  );
}
```

### 3. Navigation Protection

The sidebar automatically shows different navigation items based on user role:

```tsx
// AppSidebar.tsx
const getNavItems = (): NavItem[] => {
  const baseItems = [
    { name: "Dashboard", path: "/" },
    { name: "Profile", path: "/profile" },
  ];

  // Admin-specific items
  if (user?.role === 'admin') {
    baseItems.push({
      name: "Management",
      subItems: [
        { name: "Creators", path: "/creators" },
        { name: "Campaigns", path: "/campaigns" },
      ],
    });
  }

  // Creator-specific items
  if (user?.role === 'creator') {
    baseItems.push({
      name: "Creator Tools",
      subItems: [
        { name: "My Deliverables", path: "/my-deliverables" },
        { name: "Earnings", path: "/earnings" },
      ],
    });
  }

  return baseItems;
};
```

## Security Features

### 1. Authentication Check
- All protected routes check if user is authenticated
- Unauthenticated users are redirected to sign-in page

### 2. Role Verification
- Role information is fetched from DynamoDB after Cognito authentication
- Roles are verified on both frontend and backend

### 3. Fallback Handling
- Users without proper permissions are redirected to appropriate pages
- Graceful error handling for unauthorized access

### 4. Loading States
- Loading spinners shown while checking authentication/roles
- Prevents flash of incorrect content

## Best Practices

### 1. Always Use Route Protection
```tsx
// ✅ Good
<Route path="/admin" element={
  <AdminOnlyRoute>
    <AdminPage />
  </AdminOnlyRoute>
} />

// ❌ Bad - No protection
<Route path="/admin" element={<AdminPage />} />
```

### 2. Use Role-Based Content for UI Elements
```tsx
// ✅ Good
<RoleBasedContent
  adminContent={<AdminButton />}
  creatorContent={<CreatorButton />}
/>

// ❌ Bad - Manual role checking everywhere
{isAdmin && <AdminButton />}
{isCreator && <CreatorButton />}
```

### 3. Keep Role Logic Centralized
```tsx
// ✅ Good - Use useRole hook
const { isAdmin, hasRole } = useRole();

// ❌ Bad - Direct user access
const isAdmin = user?.role === 'admin';
```

### 4. Provide Fallback Content
```tsx
// ✅ Good
<RoleBasedContent
  adminContent={<AdminPanel />}
  creatorContent={<CreatorPanel />}
  fallbackContent={<NoAccessMessage />}
/>

// ❌ Bad - No fallback
<RoleBasedContent
  adminContent={<AdminPanel />}
  creatorContent={<CreatorPanel />}
/>
```

## Testing

### Demo Page
Visit `/role-demo` to see all role-based features in action:
- Current user information
- Role-based content examples
- Route protection examples
- Navigation changes

### Testing Different Roles
1. **Admin Testing**: Create an admin user in AWS Cognito and DynamoDB
2. **Creator Testing**: Sign up as a creator through the signup form
3. **Unauthenticated Testing**: Test without logging in

## Future Enhancements

1. **Permission Granularity**: Add more specific permissions beyond just roles
2. **Role Hierarchy**: Support for role inheritance
3. **Audit Logging**: Track role-based access attempts
4. **Dynamic Permissions**: Allow admins to modify user permissions
5. **Multi-tenant Support**: Support for different organizations with different roles

## Troubleshooting

### Common Issues

1. **User not redirected properly**
   - Check if user role is correctly set in DynamoDB
   - Verify Cognito authentication is working

2. **Navigation not updating**
   - Ensure useAuth hook is properly integrated
   - Check if user data is being refreshed

3. **Role-based content not showing**
   - Verify useRole hook is being used correctly
   - Check if RoleBasedContent component is properly configured

### Debug Tools

- Use the `/role-demo` page to test role functionality
- Check browser console for authentication errors
- Verify user data in AWS DynamoDB console 