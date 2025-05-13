function StatusTable({ shipments }) {
    return (
        <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr>
                    <th>SI番号</th>
                    <th>ステータス</th>
                    <th>ETA</th>
                </tr>
            </thead>
            <tbody>
                {shipments.map((s) => (
                    <tr key={s.siNumber}>
                        <td>{s.siNumber}</td>
                        <td>{s.status}</td>
                        <td>{s.eta}</td>

                    </tr>
                ))}

            </tbody>
        </table>
    );
}

export default StatusTable;