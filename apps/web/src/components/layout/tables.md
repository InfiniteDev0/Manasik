Install the main component and dependencies:

npm
pnpm
yarn
bun

pnpm dlx shadcn@latest add "@diceui/data-grid"
Install the following optional components:

getDataGridSelectColumn:

npm
pnpm
yarn
bun

pnpm dlx shadcn@latest add "@diceui/data-grid-select-column"
DataGridSortMenu:

npm
pnpm
yarn
bun

pnpm dlx shadcn@latest add "@diceui/data-grid-sort-menu"
DataGridFilterMenu:

npm
pnpm
yarn
bun

pnpm dlx shadcn@latest add "@diceui/data-grid-filter-menu"
DataGridRowHeightMenu:

npm
pnpm
yarn
bun

pnpm dlx shadcn@latest add "@diceui/data-grid-row-height-menu"
DataGridViewMenu:

npm
pnpm
yarn
bun

pnpm dlx shadcn@latest add "@diceui/data-grid-view-menu"
DataGridKeyboardShortcuts:

npm
pnpm
yarn
bun

pnpm dlx shadcn@latest add "@diceui/data-grid-keyboard-shortcuts"
DataGridSkeleton:

npm
pnpm
yarn
bun

pnpm dlx shadcn@latest add "@diceui/data-grid-skeleton"
useDataGridUndoRedo:

npm
pnpm
yarn
bun

pnpm dlx shadcn@latest add "@diceui/use-data-grid-undo-redo"
Update import paths for custom components:

The shadcn CLI doesn't handle custom component paths properly (see issue). You'll need to update these imports manually:

In lib/data-grid.ts:

lib/data-grid.ts

import type { 
  CellPosition, 
  Direction, 
  FileCellData, 
  RowHeightValue, 
} from "@/components/data-grid/data-grid"; 
import type { 
  CellPosition, 
  Direction, 
  FileCellData, 
  RowHeightValue, 
} from "@/types/data-grid"; 
In hooks/use-data-grid.ts:

hooks/use-data-grid.ts

import { 
  getCellKey, 
  getIsFileCellData, 
  getIsInPopover, 
  getRowHeightValue, 
  getScrollDirection, 
  matchSelectOption, 
  parseCellKey, 
  scrollCellIntoView, 
} from "@/components/data-grid/data-grid"; 
import type { 
  CellPosition, 
  ContextMenuState, 
  Direction, 
  FileCellData, 
  NavigationDirection, 
  PasteDialogState, 
  RowHeightValue, 
  SearchState, 
  SelectionState, 
  CellUpdate, 
} from "@/components/data-grid/data-grid"; 
import { 
  getCellKey, 
  getIsFileCellData, 
  getIsInPopover, 
  getRowHeightValue, 
  getScrollDirection, 
  matchSelectOption, 
  parseCellKey, 
  scrollCellIntoView, 
} from "@/lib/data-grid"; 
import type { 
  CellPosition, 
  ContextMenuState, 
  Direction, 
  FileCellData, 
  NavigationDirection, 
  PasteDialogState, 
  RowHeightValue, 
  SearchState, 
  SelectionState, 
  CellUpdate, 
} from "@/types/data-grid"; 
In all components/data-grid/*.tsx files:

Update imports to use @/lib/data-grid for utility functions and @/types/data-grid for types instead of importing from @/components/data-grid/data-grid.

Usage
Basic Data Grid

import { DataGrid } from "@/components/data-grid/data-grid";
import { DataGridKeyboardShortcuts } from "@/components/data-grid/data-grid-keyboard-shortcuts";
import { useDataGrid } from "@/hooks/use-data-grid";
 
export default function MyDataGrid() {
  const [data, setData] = React.useState(initialData);
  
  const columns = React.useMemo(() => [
    {
      id: "name",
      accessorKey: "name",
      header: "Name",
      meta: {
        cell: {
          variant: "short-text",
        },
      },
    },
    // ... other columns
  ], []);
 
  const { table, ...dataGridProps } = useDataGrid({
    data,
    columns,
    onDataChange: setData,
    getRowId: (row) => row.id,
  });
 
  return (
    <>
      <DataGridKeyboardShortcuts />
      <DataGrid table={table} {...dataGridProps} />
    </>
  );
}
With Toolbar Menus
Add sort, filter, row height, and view menus:


import { DataGrid } from "@/components/data-grid/data-grid";
import { DataGridFilterMenu } from "@/components/data-grid/data-grid-filter-menu";
import { DataGridKeyboardShortcuts } from "@/components/data-grid/data-grid-keyboard-shortcuts";
import { DataGridRowHeightMenu } from "@/components/data-grid/data-grid-row-height-menu";
import { DataGridSortMenu } from "@/components/data-grid/data-grid-sort-menu";
import { DataGridViewMenu } from "@/components/data-grid/data-grid-view-menu";
import { useDataGrid } from "@/hooks/use-data-grid";
 
export default function DataGridToolbarDemo() {
  const { table, ...dataGridProps } = useDataGrid({
    data,
    columns,
    onDataChange: setData,
  });
 
  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div role="toolbar" aria-orientation="horizontal" className="flex items-center gap-2 self-end">
        <DataGridFilterMenu table={table} />
        <DataGridSortMenu table={table} />
        <DataGridRowHeightMenu table={table} />
        <DataGridViewMenu table={table} />
      </div>
      
      <DataGridKeyboardShortcuts enableSearch={!!dataGridProps.searchState} />
      <DataGrid table={table} {...dataGridProps} />
    </div>
  );
}
With Row Management
Add and delete rows with callbacks:


const onRowAdd = React.useCallback(() => {
  setData((prev) => [...prev, { id: generateId() }]);
  
  return {
    rowIndex: data.length,
    columnId: "name", // Focus this column after creating the new row
  };
}, [data.length]);
 
const onRowsDelete = React.useCallback((rows, rowIndices) => {
  // rows: array of row data objects
  // rowIndices: array of row indices
  setData((prev) => prev.filter((row) => !rows.includes(row)));
}, []);
 
const { table, ...dataGridProps } = useDataGrid({
  data,
  columns,
  onDataChange: setData,
  onRowAdd,
  onRowsDelete,
  getRowId: (row) => row.id,
});
With Search
Use the enableSearch prop to enable search functionality:


const { table, ...dataGridProps } = useDataGrid({
  data,
  columns,
  onDataChange: setData,
  enableSearch: true, // Enable search (Ctrl/Cmd+F)
});
 
// Pass search state to keyboard shortcuts for proper shortcuts display
<DataGridKeyboardShortcuts enableSearch={!!dataGridProps.searchState} />
With Paste Support
Use the enablePaste prop to enable pasting from clipboard:


const { table, ...dataGridProps } = useDataGrid({
  data,
  columns,
  onDataChange: setData,
  enablePaste: true, // Enable paste (Ctrl/Cmd+V)
  onRowsAdd: async (count) => {
    // Called when paste needs to add new rows
    // This is more performant than adding rows one by one with the `onRowAdd` prop
    const newRows = Array.from({ length: count }, () => ({ id: generateId() }));
    setData((prev) => [...prev, ...newRows]);
  },
});
With Undo/Redo
Use the useDataGridUndoRedo hook to add undo/redo support with keyboard shortcuts (Ctrl/Cmd+Z to undo, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y to redo):


import { useDataGrid } from "@/hooks/use-data-grid";
import {
  useDataGridUndoRedo,
  type UndoRedoCellUpdate,
} from "@/hooks/use-data-grid-undo-redo";
 
export default function MyDataGrid() {
  const [data, setData] = React.useState(initialData);
 
  const { trackCellsUpdate, trackRowsAdd, trackRowsDelete } =
    useDataGridUndoRedo({
      data,
      onDataChange: setData,
      getRowId: (row) => row.id,
    });
 
  const onDataChange = React.useCallback(
    (newData: Person[]) => {
      // Track cell updates for undo/redo
      const cellUpdates: Array<UndoRedoCellUpdate> = [];
 
      for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const oldRow = data[rowIndex];
        const newRow = newData[rowIndex];
        if (!oldRow || !newRow) continue;
 
        for (const key of Object.keys(oldRow)) {
          const oldValue = oldRow[key];
          const newValue = newRow[key];
          if (!Object.is(oldValue, newValue)) {
            cellUpdates.push({
              rowId: oldRow.id,
              columnId: key,
              previousValue: oldValue,
              newValue,
            });
          }
        }
      }
 
      if (cellUpdates.length > 0) {
        trackCellsUpdate(cellUpdates);
      }
 
      setData(newData);
    },
    [data, trackCellsUpdate],
  );
 
  const onRowAdd = React.useCallback(() => {
    const newRow = { id: generateId() };
    setData((prev) => [...prev, newRow]);
    trackRowsAdd([newRow]);
    return { rowIndex: data.length, columnId: "name" };
  }, [data.length, trackRowsAdd]);
 
  const onRowsDelete = React.useCallback(
    (rows) => {
      trackRowsDelete(rows);
      setData((prev) => prev.filter((row) => !rows.includes(row)));
    },
    [trackRowsDelete],
  );
 
  const { table, ...dataGridProps } = useDataGrid({
    data,
    columns,
    onDataChange,
    onRowAdd,
    onRowsDelete,
    getRowId: (row) => row.id,
  });
 
  return (
    <>
      <DataGridKeyboardShortcuts enableUndoRedo />
      <DataGrid table={table} {...dataGridProps} />
    </>
  );
}
Read-Only Mode
Use the readOnly prop to make the grid read-only:


const { table, ...dataGridProps } = useDataGrid({
  data,
  columns,
  readOnly: true, // Disable all editing
});
RTL Support
Wrap the grid in a DirectionProvider and the language direction will be automatically detected. The direction component is included when you install the data grid — see the shadcn Direction docs for the underlying API.


import { DirectionProvider } from "@/components/ui/direction";
 
return (
  <DirectionProvider dir="rtl">
    <DataGridImpl />
  </DirectionProvider>
)
 
function DataGridImpl() {
  const { table, ...dataGridProps } = useDataGrid({
    data,
    columns,
  });
 
  return (
    <DataGrid table={table} {...dataGridProps} />
  )
}
Auto Focus
Use the autoFocus prop to automatically focus any navigable cell on mount:


const { table, ...dataGridProps } = useDataGrid({
  data,
  columns,
  autoFocus: true, // Focus first navigable cell
  // Or focus a specific cell:
  // autoFocus: { rowIndex: 0, columnId: "name" },
});
Custom Height and Stretch Columns
Control the grid height and column stretching:


<DataGrid 
  table={table} 
  {...dataGridProps} 
  height={800} // Custom height in pixels (default: 600)
  stretchColumns={true} // Stretch columns to fill available width
/>
Loading States
Use the DataGridSkeleton component for loading states:


import { Suspense } from "react";
import {
  DataGridSkeleton,
  DataGridSkeletonGrid,
  DataGridSkeletonToolbar,
} from "@/components/data-grid/data-grid-skeleton";
 
export default function Page() {
  return (
    <Suspense
      fallback={
        <DataGridSkeleton className="container flex flex-col gap-4 py-4">
          <DataGridSkeletonToolbar actionCount={5} />
          <DataGridSkeletonGrid />
        </DataGridSkeleton>
      }
    >
      <DataGridDemo />
    </Suspense>
  );
}
Cell Variants
The Data Grid supports various cell variants for different data formats:

Short Text Cell
Single-line text input with inline editing:


{
  id: "name",
  accessorKey: "name",
  header: "Name",
  meta: {
    cell: {
      variant: "short-text",
    },
  },
}
Long Text Cell
Multi-line text displayed in a popover with auto-save:


{
  id: "notes",
  accessorKey: "notes",
  header: "Notes",
  meta: {
    cell: {
      variant: "long-text",
    },
  },
}
Number Cell
Numeric input with optional constraints:


{
  id: "price",
  accessorKey: "price",
  header: "Price",
  meta: {
    cell: {
      variant: "number",
      min: 0,
      max: 1000,
      step: 0.01,
    },
  },
}
URL Cell
URL input with validation and clickable links:


{
  id: "website",
  accessorKey: "website",
  header: "Website",
  meta: {
    cell: {
      variant: "url",
    },
  },
}
Checkbox Cell
Boolean checkbox for true/false values:


{
  id: "isActive",
  accessorKey: "isActive",
  header: "Active",
  meta: {
    cell: {
      variant: "checkbox",
    },
  },
}
Select Cell
Single-select input with predefined options:


{
  id: "category",
  accessorKey: "category",
  header: "Category",
  meta: {
    cell: {
      variant: "select",
      options: [
        { label: "Electronics", value: "electronics" },
        { label: "Clothing", value: "clothing" },
        { label: "Books", value: "books" },
      ],
    },
  },
}
Multi-Select Cell
Multi-select input with predefined options and badge display:


{
  id: "skills",
  accessorKey: "skills",
  header: "Skills",
  meta: {
    cell: {
      variant: "multi-select",
      options: [
        { label: "JavaScript", value: "javascript" },
        { label: "TypeScript", value: "typescript" },
        { label: "React", value: "react" },
      ],
    },
  },
}
Date Cell
Date picker with calendar popover:


{
  id: "startDate",
  accessorKey: "startDate",
  header: "Start Date",
  meta: {
    cell: {
      variant: "date",
    },
  },
}
File Cell
File upload with support for multiple files and file management:


{
  id: "attachments",
  accessorKey: "attachments",
  header: "Attachments",
  meta: {
    cell: {
      variant: "file",
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      accept: "image/*,video/*,audio/*,.pdf,.doc,.docx",
      multiple: true,
    },
  },
}
To use file cells, provide upload and delete handlers:


const onFilesUpload = React.useCallback(async ({ files, rowIndex, columnId }) => {
  // Upload files to your server/storage
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  
  // Return array of file metadata
  return data.files.map(f => ({
    id: f.fileId,
    name: f.fileName,
    size: f.fileSize,
    type: f.fileType,
    url: f.fileUrl
  }));
}, []);
 
const onFilesDelete = React.useCallback(async ({ fileIds, rowIndex, columnId }) => {
  // Delete files from your server/storage
  await fetch('/api/files', {
    method: 'DELETE',
    body: JSON.stringify({ fileIds })
  });
}, []);
 
const { table, ...dataGridProps } = useDataGrid({
  data,
  columns,
  onFilesUpload,
  onFilesDelete,
});
Row Selection
Add a selection column to enable row selection with shift-click support using the getDataGridSelectColumn helper:


import { getDataGridSelectColumn } from "@/components/data-grid/data-grid-select-column";
 
const columns = [
  getDataGridSelectColumn<YourData>(),
  // ... other columns
];
You can customize the select column by passing options:


getDataGridSelectColumn<YourData>({
  size: 50, // Custom width (default: 40)
  enableHiding: true, // Allow hiding via view menu (default: false)
  enableResizing: true, // Allow resizing (default: false)
})
The shift-click functionality is handled automatically by the useDataGrid hook when you include the select column.

Cell Architecture
The Data Grid uses a three-layer cell composition pattern:

DataGridCell: Routes to the appropriate cell variant based on the column's meta.cell.variant property
Cell Variants: Implement specific editing UIs for different data variants (text, number, select, etc.)
DataGridCellWrapper: Provides common functionality for all cells (focus, selection, keyboard interactions)

// Cell composition flow
<DataGridCell cell={cell} table={table} />
  ↓
<ShortTextCell {...props} />  // Based on variant
  ↓
<DataGridCellWrapper {...props}>
  {/* Cell-specific content */}
</DataGridCellWrapper>
Each cell variant receives the same props and wraps its content in DataGridCellWrapper, which provides:

Focus management and visual focus ring
Selection state and highlighting
Search match highlighting
Click, double-click, and keyboard event management
Edit mode triggering (Enter, F2, Space, or typing)
Creating Custom Cell Variants
You can create custom cell variants by implementing the DataGridCellProps interface and wrapping your content in DataGridCellWrapper:


import { DataGridCellWrapper } from "@/components/data-grid/data-grid-cell-wrapper";
import type { DataGridCellProps } from "@/types/data-grid";
 
export function CustomCell<TData>({
  cell,
  tableMeta,
  rowIndex,
  columnId,
  isFocused,
  isEditing,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  readOnly,
}: DataGridCellProps<TData>) {
  const value = cell.getValue() as CustomCellValue;
  
  return (
    <DataGridCellWrapper
      cell={cell}
      tableMeta={tableMeta}
      rowIndex={rowIndex}
      columnId={columnId}
      isEditing={isEditing}
      isFocused={isFocused}
      isSelected={isSelected}
      isSearchMatch={isSearchMatch}
      isActiveSearchMatch={isActiveSearchMatch}
      readOnly={readOnly}
    >
      {/* Your custom cell content */}
    </DataGridCellWrapper>
  );
}
Column Configuration
Enabling Filtering and Sorting
To enable filtering and sorting on columns, use the filterFn from the data grid library:


import { getFilterFn } from "@/lib/data-grid-filters";
 
const columns = React.useMemo(() => {
  const filterFn = getFilterFn<YourData>();
  
  return [
    {
      id: "name",
      accessorKey: "name",
      header: "Name",
      filterFn, // Enable filtering
      // Sorting is enabled by default
      meta: {
        label: "Name", // Label shown in filter/sort menus
        cell: {
          variant: "short-text",
        },
      },
    },
    // ... other columns
  ];
}, []);
Column Pinning
Pin columns to the left or right:


const { table, ...dataGridProps } = useDataGrid({
  data,
  columns,
  initialState: {
    columnPinning: {
      left: ["select", "name"], // Pin to left side
      right: ["actions"], // Pin to right side
    },
  },
});
You can also pin/unpin columns dynamically via the column header dropdown menu.

Column Resizing
Column resizing is enabled by default. Users can:

Drag the column resize handle
Double-click the resize handle to auto-fit the column width
Set minimum column size using minSize:


{
  id: "name",
  accessorKey: "name",
  header: "Name",
  minSize: 180, // Minimum width in pixels
  meta: {
    cell: {
      variant: "short-text",
    },
  },
}
Context Menu Actions
Right-click on cells to access context menu options:

Copy (Ctrl/Cmd+C): Copy selected cells to clipboard
Cut (Ctrl/Cmd+X): Cut selected cells (shows visual indicator)
Clear (Delete/Backspace): Clear content from selected cells
Delete rows (Ctrl/Cmd+Backspace): Remove selected rows (only available when onRowsDelete is provided)
API Reference
useDataGrid
Hook for initializing the data grid with state management and editing capabilities.

Prop

Type


onDataChange?
union

onRowAdd?
union

onRowsAdd?
union

onRowsDelete?
union

onFilesUpload?
union

onFilesDelete?
union

dir?
union

rowHeight?
union

overscan?
union

autoFocus?
union

enableColumnSelection?
union

enableSearch?
union

enablePaste?
union

readOnly?
union

data
array

columns
array

getRowId?
union

defaultColumn?
union

initialState?
union

state?
union
useDataGridUndoRedo
Hook for adding undo/redo support to the data grid with keyboard shortcuts and history management.

Prop

Type


data
array

onDataChange
function

getRowId
function

maxHistory?
union

enabled?
union
Returns:

Prop

Type


canUndo
union

canRedo
union

onUndo
function

onRedo
function

onClear
function

trackCellsUpdate
function

trackRowsAdd
function

trackRowsDelete
function
DataGrid
Main data grid component with virtualization and editing capabilities.

Prop

Type


table
object

tableMeta
object

columns
array

dataGridRef
object

headerRef
object

footerRef
object

rowMapRef
object

virtualTotalSize
number

virtualItems
array

measureElement
function

dir?
union

height?
union

searchState?
union

columnSizeVars
object

cellSelectionMap
object

searchMatchesByRow
union

activeSearchMatch
union

focusedCell
union

editingCell
union

rowHeight
RowHeightValue

contextMenu
object

pasteDialog
object

onRowAdd?
union

stretchColumns?
union
getDataGridSelectColumn
A utility function that returns a reusable select column definition for the data grid with checkbox selection and shift-click support.

Prop

Type


getUniqueValues?
union

footer?
union

cell?
union

meta?
union

enableHiding?
union

enablePinning?
union

enableColumnFilter?
union

filterFn?
union

enableGlobalFilter?
union

enableMultiSort?
union

enableSorting?
union

invertSorting?
union

sortDescFirst?
union

sortingFn?
union

sortUndefined?
union

aggregatedCell?
union

aggregationFn?
union

enableGrouping?
union

getGroupingValue?
union

enableResizing?
union

maxSize?
union

minSize?
union

size?
union

header?
union

id?
union
DataGridColumnHeader
Column header with sorting controls and visual indicators for sort direction.

Prop

Type


header
object

table
object
DataGridCell
Routes to the appropriate cell variant based on the column's meta.cell.variant property.

Prop

Type


cell
object

table
object

rowIndex
number

columnId
string

isFocused
union

isEditing
union

isSelected
union

isSearchMatch
union

isActiveSearchMatch
union

readOnly
union
DataGridCellWrapper
Base wrapper providing common functionality for all cell variants including focus management, selection state, search highlighting, and keyboard interactions.

Prop

Type


cell
object

table
object

rowIndex
number

columnId
string

isFocused
union

isEditing
union

isSelected
union

isSearchMatch
union

isActiveSearchMatch
union

readOnly
union
DataGridCellVariants
Individual cell variants for different data variants. Each variant implements the DataGridCellProps interface and wraps its content in DataGridCellWrapper.

Prop

Type


cell
object

table
object

rowIndex
number

columnId
string

isFocused
union

isEditing
union

isSelected
union

isSearchMatch
union

isActiveSearchMatch
union

readOnly
union
Available cell variants:

ShortTextCell: Single-line text input with inline contentEditable
LongTextCell: Multi-line textarea displayed in a popover dialog with auto-save
NumberCell: Numeric input with optional min, max, and step constraints
UrlCell: URL input with validation and clickable links
SelectCell: Single-select dropdown with predefined options
MultiSelectCell: Multi-select input with badge display and command palette
CheckboxCell: Boolean checkbox for true/false values
DateCell: Date picker with calendar popover
FileCell: File upload with support for multiple files and file management
DataGridRow
Individual row component with virtualization support for large datasets.

Prop

Type


row
object

tableMeta
object

virtualItem
object

measureElement
function

rowMapRef
object

rowHeight
RowHeightValue

columnVisibility
VisibilityState

columnPinning
object

focusedCell
union

editingCell
union

cellSelectionKeys
object

searchMatchColumns
union

activeSearchMatch
union

dir
Direction

readOnly
union

stretchColumns
union
DataGridSearch
Search menu with keyboard shortcuts for finding and navigating between matching cells in the grid.

Prop

Type


searchQuery
string

onSearchQueryChange
function

searchMatches
array

matchIndex
number

searchOpen
union

onSearchOpenChange
function

onNavigateToNextMatch
function

onNavigateToPrevMatch
function

onSearch
function
DataGridFilterMenu
Filter menu with drag-and-drop reordering and advanced filtering operators for text, number, date, select, and boolean fields.

Prop

Type


table
object

disabled?
union
DataGridSortMenu
Sort menu with drag-and-drop reordering for multi-column sorting with ascending/descending controls.

Prop

Type


table
object

disabled?
union
DataGridRowHeightMenu
Row height menu for adjusting row sizes between short, medium, tall, and extra-tall options.

Prop

Type


table
object

disabled?
union
DataGridViewMenu
View menu for controlling column visibility with search functionality.

Prop

Type


table
object

disabled?
union
DataGridContextMenu
Right-click context menu for quick access to common cell and row actions like copy, cut, clear, and delete.

Prop

Type


table
object
DataGridPasteDialog
Dialog for handling paste operations that require adding new rows to the grid.

Prop

Type


tableMeta
object

pasteDialog
object
DataGridKeyboardShortcuts
Searchable reference dialog for all available keyboard shortcuts for navigating and interacting with the data grid.

Prop

Type


enableSearch?
union

enableUndoRedo?
union

enablePaste?
union

enableRowAdd?
union

enableRowsDelete?
union
DataGridSkeleton
A composable skeleton component for the data grid with toolbar and grid parts for loading states.


import {
  DataGridSkeleton,
  DataGridSkeletonGrid,
  DataGridSkeletonToolbar,
} from "@/components/data-grid/data-grid-skeleton";
 
return (
  <DataGridSkeleton>
    <DataGridSkeletonToolbar />
    <DataGridSkeletonGrid />
  </DataGridSkeleton>
);
Prop

Type

DataGridSkeletonToolbar
Prop

Type


align?
union

actionCount?
union
DataGridSkeletonGrid
Prop

Type

Accessibility
The Data Grid follows WAI-ARIA guidelines for grid widgets:

Full keyboard navigation support
Proper ARIA labels, roles, and properties
Focus management with visible focus indicators
Keyboard shortcuts for all actions
Screen reader friendly cell updates
Keyboard Interactions
Navigation
Key	Description
Navigate between cells
Move to next cell
Move to previous cell
Move to first column
Move to last column
Move to first row (same column)
Move to last row (same column)
Move to first column (same row)
Move to last column (same row)
Move to first cell
Move to last cell
Move up one page
Move down one page
Scroll up one page
Scroll down one page
Scroll left one page of columns
Scroll right one page of columns
Selection
Key	Description
Extend selection
Select to top of table
Select to bottom of table
Select to first column
Select to last column
Select all cells
Toggle cell selection
Select range
Clear selection or exit edit mode
Editing
Key	Description
Start editing cell
Start editing cell
Start editing cell
Insert row below
Copy selected cells
Cut selected cells
Paste cells
Clear selected cells
Clear selected cells
Delete selected rows
Delete selected rows
Undo last action
Redo last action
Redo last action
Search & Shortcuts
Key	Description
Open search
Next search match (when search is open)
Previous search match (when search is open)
Close search (when search is open)
Toggle filter menu
Toggle sort menu
Show keyboard shortcuts
Features
The Data Grid component provides a comprehensive spreadsheet-like experience with:

Core Features
High Performance: Virtualized rows and columns for handling large datasets (10,000+ rows)
Cell Editing: In-place editing with 9 different cell variants
Cell Selection: Single and multi-cell selection with keyboard and mouse
Keyboard Navigation: Full keyboard support with Excel-like shortcuts
Copy/Cut/Paste: Full clipboard support including paste from Excel/Google Sheets
Undo/Redo: Full history support for cell updates, row additions, and deletions (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z)
Context Menu: Right-click actions for cells and rows
Search: Find and navigate to matching cells (Ctrl/Cmd+F)
Filtering: Advanced filtering with multiple operators and drag-and-drop reordering
Sorting: Multi-column sorting with drag-and-drop reordering
Row Management: Add and delete rows with callbacks
Column Features: Resizing, pinning (left/right), hiding, and reordering
Cell Variants
Text Cells: Short-text and long-text with auto-save
Number Cells: With min/max/step constraints
URL Cells: With validation and clickable links
Date Cells: Calendar picker with keyboard navigation
Select Cells: Single and multi-select with search
Checkbox Cells: Boolean values
File Cells: Upload and manage multiple files per cell
Advanced Features
Smart Paste: Automatically expands grid when pasting more data than fits
Auto-Fill: Type to start editing, like in Excel
Row Heights: Adjustable row heights (short, medium, tall, extra-tall)
RTL Support: Full right-to-left language support
Read-Only Mode: Lock the grid to prevent editing
Auto-Focus: Focus specific cell on mount
Accessibility: Full ARIA support and keyboard navigation
Credits
TanStack Table - For the table state management.
TanStack Virtual - For the virtualization.
shadcn/ui - For the UI components.
Airtable and Glide Data Grid - For accessibility and best practices.