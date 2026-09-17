/**
 * Tooltip for a sidebar button, passed as its `tooltip` prop. SidebarMenuButton
 * only shows it while the sidebar is collapsed to the icon rail.
 *
 * `sideOffset` is measured from the button, not the rail: buttons sit ~13px in
 * from the rail's edge, so 24 leaves a clear gap between the rail and the
 * tooltip instead of letting it touch.
 */
export function railTooltip(label: string) {
  return {
    children: label,
    className: "rounded-xl px-3.5 py-2 text-[15px] font-medium",
    sideOffset: 24,
  }
}
