import adminSectionStyles from '../../styles/adminSectionStyles'

/**
 * Renders the standard admin list table shell (header row + body slot).
 * Help Requests, Agencies, and similar admin pages share this layout so
 * column labels can differ while the table structure stays consistent.
 *
 * @param {Object} props
 * @param {Array<string | { label: string, center?: boolean }>} props.columns
 *   Column header labels. Pass `{ label, center: true }` for centered headers.
 * @param {React.ReactNode} props.children Table body rows.
 * @returns {JSX.Element}
 */
const AdminDataTable = ({ columns, children }) => (
	<table data-component="AdminDataTable" className={adminSectionStyles.table_main}>
		<thead className={adminSectionStyles.table_thead}>
			<tr>
				{columns.map((column) => {
					const label = typeof column === 'string' ? column : column.label
					const center = typeof column === 'object' && column.center

					return (
						<th
							key={label}
							className={
								center
									? `${adminSectionStyles.table_th} text-center`
									: adminSectionStyles.table_th
							}>
							{label}
						</th>
					)
				})}
			</tr>
		</thead>
		<tbody>{children}</tbody>
	</table>
)

export default AdminDataTable
