# Accessibility Code Examples 🛠️

**Practical accessibility patterns and fixes for Relife Alarm App**

This guide provides real-world examples showing how to implement accessible components and fix
common accessibility issues in React/TypeScript applications.

## Table of Contents

- [Button Accessibility](#button-accessibility)
- [Form Components](#form-components)
- [Modal and Dialog](#modal-and-dialog)
- [Navigation](#navigation)
- [Lists and Data Display](#lists-and-data-display)
- [Loading States](#loading-states)
- [Error Handling](#error-handling)
- [Mobile Accessibility](#mobile-accessibility)
- [Testing Examples](#testing-examples)

---

## Button Accessibility

### ✅ Accessible Button Examples

```tsx
// Primary action button with clear purpose
export function CreateAlarmButton({ onClick, isLoading }: CreateAlarmButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      aria-label={isLoading ? 'Creating alarm...' : 'Create new alarm'}
      className="btn-primary focus:ring-2 focus:ring-blue-500 focus:outline-none"
    >
      {isLoading ? (
        <>
          <LoadingSpinner aria-hidden="true" />
          <span>Creating...</span>
        </>
      ) : (
        <>
          <PlusIcon aria-hidden="true" />
          <span>Create Alarm</span>
        </>
      )}
    </button>
  );
}

// Icon button with accessible name
export function DeleteAlarmButton({ alarm, onDelete }: DeleteAlarmButtonProps) {
  return (
    <button
      onClick={() => onDelete(alarm.id)}
      aria-label={`Delete ${alarm.name} alarm`}
      className="btn-ghost btn-sm hover:bg-red-50 hover:text-red-600 focus:ring-2 focus:ring-red-500"
    >
      <TrashIcon aria-hidden="true" className="w-4 h-4" />
    </button>
  );
}

// Toggle button showing state
export function AlarmToggleButton({ alarm, onToggle }: AlarmToggleButtonProps) {
  const handleToggle = () => onToggle(alarm.id);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <button
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      role="switch"
      aria-checked={alarm.enabled}
      aria-label={`${alarm.enabled ? 'Disable' : 'Enable'} ${alarm.name} alarm`}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        alarm.enabled ? 'bg-blue-600' : 'bg-gray-200'
      )}
    >
      <span className="sr-only">{alarm.enabled ? 'Disable' : 'Enable'} alarm</span>
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition',
          alarm.enabled ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}
```

### ❌ Common Button Mistakes

```tsx
// DON'T: Unclear purpose and missing accessibility
function BadButton() {
  return (
    <button onClick={doSomething} className="text-gray-400">
      {' '}
      {/* Low contrast */}
      <Icon /> {/* No accessible name */}
    </button>
  );
}

// DON'T: Non-semantic button
function BadCustomButton() {
  return (
    <div onClick={handleClick} className="looks-like-button">
      {' '}
      {/* Not keyboard accessible */}
      Click me
    </div>
  );
}
```

---

## Form Components

### ✅ Accessible Form Examples

```tsx
// Complete form field with validation
export function AlarmTimeField({ value, onChange, error }: AlarmTimeFieldProps) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  return (
    <div className="form-field">
      <label htmlFor={fieldId} className="block text-sm font-medium mb-1">
        Alarm Time
        <span className="text-red-500 ml-1" aria-label="required">
          *
        </span>
      </label>

      <input
        id={fieldId}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={`${helpId} ${error ? errorId : ''}`}
        aria-invalid={!!error}
        required
        className={cn(
          'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          error ? 'border-red-300' : 'border-gray-300'
        )}
      />

      <div id={helpId} className="text-sm text-gray-600 mt-1">
        Select when you want your alarm to go off
      </div>

      {error && (
        <div id={errorId} role="alert" className="text-sm text-red-600 mt-1">
          <AlertCircleIcon aria-hidden="true" className="w-4 h-4 inline mr-1" />
          {error}
        </div>
      )}
    </div>
  );
}

// Grouped form fields with fieldset
export function RepeatDaysField({ selectedDays, onChange }: RepeatDaysFieldProps) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <fieldset className="border border-gray-200 p-4 rounded-md">
      <legend className="text-sm font-medium px-2">Repeat Days</legend>

      <div className="grid grid-cols-2 gap-2 mt-2">
        {days.map((day) => {
          const dayId = `day-${day.toLowerCase()}`;
          const isSelected = selectedDays.includes(day);

          return (
            <label key={day} htmlFor={dayId} className="flex items-center space-x-2 cursor-pointer">
              <input
                id={dayId}
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selectedDays, day]);
                  } else {
                    onChange(selectedDays.filter((d) => d !== day));
                  }
                }}
                className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm">{day}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// Select dropdown with proper labeling
export function AlarmSoundField({ value, onChange, options, error }: AlarmSoundFieldProps) {
  const fieldId = useId();

  return (
    <div className="form-field">
      <label htmlFor={fieldId} className="block text-sm font-medium mb-1">
        Alarm Sound
      </label>

      <select
        id={fieldId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select a sound</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <div role="alert" className="text-sm text-red-600 mt-1">
          {error}
        </div>
      )}
    </div>
  );
}
```

### ❌ Common Form Mistakes

```tsx
// DON'T: Missing labels and error association
function BadFormField() {
  return (
    <div>
      <input placeholder="Enter time" /> {/* Placeholder is not a label */}
      <div className="error">Invalid time</div> {/* Error not associated */}
    </div>
  );
}

// DON'T: Poor fieldset usage
function BadFieldset() {
  return (
    <div className="group">
      {' '}
      {/* Should use fieldset */}
      <div>Days:</div> {/* Should use legend */}
      <input type="checkbox" /> Mon
      <input type="checkbox" /> Tue
    </div>
  );
}
```

---

## Modal and Dialog

### ✅ Accessible Modal Examples

```tsx
export function DeleteAlarmDialog({ alarm, isOpen, onClose, onConfirm }: DeleteAlarmDialogProps) {
  // Focus management
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [isOpen]);

  // Escape key handling
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} aria-hidden="true" />

      {/* Dialog content */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
          <div className="flex items-center mb-4">
            <AlertTriangleIcon aria-hidden="true" className="w-6 h-6 text-red-600 mr-3" />
            <h2 id="dialog-title" className="text-lg font-semibold">
              Delete Alarm
            </h2>
          </div>

          <p id="dialog-description" className="text-gray-600 mb-6">
            Are you sure you want to delete "{alarm.name}"? This alarm will be permanently removed
            and cannot be recovered.
          </p>

          <div className="flex justify-end space-x-3">
            <button
              ref={cancelButtonRef}
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm(alarm.id);
                onClose();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500"
            >
              Delete Alarm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal with form - complex focus management
export function EditAlarmModal({ alarm, isOpen, onClose, onSave }: EditAlarmModalProps) {
  const [formData, setFormData] = useState(alarm);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Alarm</DialogTitle>
          <DialogDescription>Modify your alarm settings below.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="alarm-name-edit" className="block text-sm font-medium mb-1">
              Alarm Name
            </label>
            <input
              ref={firstInputRef}
              id="alarm-name-edit"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="alarm-time-edit" className="block text-sm font-medium mb-1">
              Time
            </label>
            <input
              id="alarm-time-edit"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Navigation

### ✅ Accessible Navigation Examples

```tsx
// Main navigation with proper landmarks
export function MainNavigation() {
  const location = useLocation();

  const navItems = [
    { href: '/alarms', label: 'My Alarms', icon: AlarmClockIcon },
    { href: '/create', label: 'Create Alarm', icon: PlusIcon },
    { href: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <nav aria-label="Main navigation" className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link
              to="/"
              className="flex-shrink-0 flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-2"
              aria-label="Relife Alarm - Home"
            >
              <img className="h-8 w-8" src="/logo.png" alt="Relife Alarm" />
              <span className="ml-2 text-xl font-semibold">Relife</span>
            </Link>

            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500',
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    <Icon aria-hidden="true" className="w-4 h-4 mr-1" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Mobile navigation with proper ARIA
export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label="Toggle navigation menu"
        className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {isOpen ? (
          <XIcon aria-hidden="true" className="w-6 h-6" />
        ) : (
          <MenuIcon aria-hidden="true" className="w-6 h-6" />
        )}
      </button>

      {isOpen && (
        <div id="mobile-menu" className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// Breadcrumb navigation
export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol role="list" className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.href || item.label} className="flex items-center">
              {index > 0 && (
                <ChevronRightIcon aria-hidden="true" className="w-4 h-4 text-gray-400 mx-2" />
              )}
              {isLast ? (
                <span aria-current="page" className="text-gray-500">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href!}
                  className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-1"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

---

## Lists and Data Display

### ✅ Accessible List Examples

```tsx
// Alarm list with proper structure
export function AlarmList({ alarms, onToggle, onEdit, onDelete }: AlarmListProps) {
  if (alarms.length === 0) {
    return (
      <div role="status" className="text-center py-8 text-gray-500" aria-live="polite">
        <AlarmClockIcon aria-hidden="true" className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No alarms yet. Create your first alarm to get started!</p>
      </div>
    );
  }

  return (
    <div role="region" aria-labelledby="alarms-heading">
      <h2 id="alarms-heading" className="text-lg font-semibold mb-4">
        Your Alarms ({alarms.length})
      </h2>

      <ul role="list" className="space-y-3">
        {alarms.map((alarm) => (
          <li
            key={alarm.id}
            className="bg-white rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <time className="text-2xl font-bold text-gray-900">{alarm.time}</time>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{alarm.name}</h3>
                    <p className="text-xs text-gray-500">
                      {alarm.repeatDays.length > 0 ? alarm.repeatDays.join(', ') : 'One time'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <AlarmToggleButton alarm={alarm} onToggle={onToggle} />

                <button
                  onClick={() => onEdit(alarm)}
                  aria-label={`Edit ${alarm.name} alarm`}
                  className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                >
                  <EditIcon aria-hidden="true" className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onDelete(alarm)}
                  aria-label={`Delete ${alarm.name} alarm`}
                  className="p-2 text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-md"
                >
                  <TrashIcon aria-hidden="true" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Data table with proper headers
export function AlarmHistoryTable({ history }: AlarmHistoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <caption className="sr-only">
          Alarm history showing when alarms were triggered and dismissed
        </caption>

        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Date
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Alarm Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Triggered At
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {history.map((entry) => (
            <tr key={entry.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Date(entry.date).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {entry.alarmName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Date(entry.triggeredAt).toLocaleTimeString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={cn(
                    'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                    entry.status === 'dismissed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  )}
                >
                  {entry.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Loading States

### ✅ Accessible Loading Examples

```tsx
// Loading spinner with screen reader announcement
export function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center">
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
          size === 'sm' && 'w-4 h-4',
          size === 'md' && 'w-8 h-8',
          size === 'lg' && 'w-12 h-12'
        )}
        aria-hidden="true"
      />
      <span className={message ? 'ml-2 text-sm text-gray-600' : 'sr-only'}>
        {message || 'Loading...'}
      </span>
    </div>
  );
}

// Skeleton loading with proper ARIA
export function AlarmListSkeleton() {
  return (
    <div aria-label="Loading alarms" role="status" aria-live="polite">
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-1">
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="w-12 h-6 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading your alarms...</span>
    </div>
  );
}

// Progressive loading with status updates
export function ProgressiveLoader({ steps, currentStep }: ProgressiveLoaderProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Setup progress: ${Math.round(progress)}% complete`}
      className="w-full"
    >
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-blue-700">{steps[currentStep]?.label}</span>
        <span className="text-sm font-medium text-blue-700">{Math.round(progress)}%</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div aria-live="polite" className="sr-only">
        Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.label}
      </div>
    </div>
  );
}
```

---

## Error Handling

### ✅ Accessible Error Examples

```tsx
// Form field error with clear association
export function FormFieldWithError({ error, ...props }: FormFieldProps) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;

  return (
    <div>
      <input
        {...props}
        id={fieldId}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={!!error}
        className={cn(
          'border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500',
          error ? 'border-red-300' : 'border-gray-300'
        )}
      />
      {error && (
        <div id={errorId} role="alert" className="text-red-600 text-sm mt-1">
          <AlertCircleIcon aria-hidden="true" className="w-4 h-4 inline mr-1" />
          {error}
        </div>
      )}
    </div>
  );
}

// Page-level error boundary
export function ErrorBoundary({ error, resetError }: ErrorBoundaryProps) {
  useEffect(() => {
    // Focus error message for screen readers
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.focus();
    }
  }, [error]);

  return (
    <div role="alert" className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <AlertTriangleIcon aria-hidden="true" className="w-8 h-8 text-red-600 mr-3" />
          <h1
            id="error-message"
            tabIndex={-1}
            className="text-lg font-semibold text-gray-900 focus:outline-none"
          >
            Something went wrong
          </h1>
        </div>

        <p className="text-gray-600 mb-6">
          We encountered an unexpected error. Please try refreshing the page or contact support if
          the problem persists.
        </p>

        <div className="flex space-x-3">
          <button
            onClick={resetError}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
          >
            Refresh Page
          </button>
        </div>

        <details className="mt-4">
          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
            Technical Details
          </summary>
          <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto">
            {error.message}
          </pre>
        </details>
      </div>
    </div>
  );
}

// Network error with retry functionality
export function NetworkError({ onRetry }: NetworkErrorProps) {
  return (
    <div role="alert" className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <div className="flex">
        <WifiOffIcon aria-hidden="true" className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">Connection Error</h3>
          <p className="text-sm text-yellow-700 mt-1">
            Unable to connect to the server. Please check your internet connection and try again.
          </p>
          <button
            onClick={onRetry}
            className="mt-3 text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Testing Examples

### ✅ Jest-axe Testing Examples

```tsx
// Basic component accessibility test
import { axeRender } from '../../../tests/utils/a11y-testing-utils';
import { AlarmToggleButton } from '../AlarmToggleButton';

describe('AlarmToggleButton Accessibility', () => {
  const mockAlarm = {
    id: '1',
    name: 'Morning Alarm',
    time: '07:00',
    enabled: true,
  };

  it('should be accessible when enabled', async () => {
    await axeRender(<AlarmToggleButton alarm={mockAlarm} onToggle={jest.fn()} />);
  });

  it('should be accessible when disabled', async () => {
    await axeRender(
      <AlarmToggleButton alarm={{ ...mockAlarm, enabled: false }} onToggle={jest.fn()} />
    );
  });

  it('should have proper ARIA attributes', async () => {
    const { container } = render(<AlarmToggleButton alarm={mockAlarm} onToggle={jest.fn()} />);

    const button = container.querySelector('button');
    expect(button).toHaveAttribute('role', 'switch');
    expect(button).toHaveAttribute('aria-checked', 'true');
    expect(button).toHaveAccessibleName('Disable Morning Alarm alarm');
  });

  it('should be keyboard accessible', async () => {
    const onToggle = jest.fn();
    const { container } = render(<AlarmToggleButton alarm={mockAlarm} onToggle={onToggle} />);

    const button = container.querySelector('button')!;

    // Test Enter key
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(onToggle).toHaveBeenCalledWith(mockAlarm.id);

    // Test Space key
    fireEvent.keyDown(button, { key: ' ' });
    expect(onToggle).toHaveBeenCalledTimes(2);
  });
});

// Form accessibility testing
describe('AlarmForm Accessibility', () => {
  it('should associate labels with inputs', async () => {
    const { container } = render(<AlarmForm />);

    const timeInput = screen.getByLabelText('Alarm Time');
    expect(timeInput).toBeInTheDocument();
    expect(timeInput).toHaveAttribute('type', 'time');

    const nameInput = screen.getByLabelText('Alarm Name');
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveAttribute('required');
  });

  it('should announce validation errors', async () => {
    const { container } = render(<AlarmForm />);

    const submitButton = screen.getByRole('button', { name: 'Create Alarm' });
    fireEvent.click(submitButton);

    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('Please enter an alarm name');
  });
});
```

### ✅ Playwright E2E Testing Examples

```tsx
// E2E accessibility tests
import { test, expect } from '@playwright/test';
import { PlaywrightA11yUtils } from '../../utils/playwright-a11y-utils';

test.describe('Alarm Management Accessibility', () => {
  let a11yUtils: PlaywrightA11yUtils;

  test.beforeEach(async ({ page }) => {
    a11yUtils = new PlaywrightA11yUtils(page);
    await page.goto('/alarms');
  });

  test('should be accessible via keyboard navigation', async ({ page }) => {
    // Test tab navigation through the page
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // Logo
    await page.keyboard.press('Tab'); // First nav item

    // Verify focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Test keyboard interaction
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/alarms');
  });

  test('should have no critical accessibility violations', async ({ page }) => {
    const violations = await a11yUtils.runAxeTest(page, {
      rules: a11yUtils.axeConfigs.critical,
    });

    await a11yUtils.expectNoViolations(violations, ['critical', 'serious']);
  });

  test('should support screen reader navigation', async ({ page }) => {
    // Test heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const h1Count = await headings.filter('h1').count();
    expect(h1Count).toBe(1); // Should have exactly one h1

    // Test landmarks
    const main = page.locator('main');
    await expect(main).toBeVisible();

    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });
});
```

---

This examples file provides real-world, copy-paste-ready code that developers can use to implement
accessible components in the Relife alarm app. Each example shows both the correct implementation
and common mistakes to avoid.
