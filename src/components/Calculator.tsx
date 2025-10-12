import React, { useEffect, useRef, useState } from 'react'
import Chart from 'chart.js/auto'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'


<div id="resultsSection" style={{ display: 'none' }}>
<div className="card">
<div id="totalSummary" className="total-summary">
<p>Total Estimated Cost</p>
<span id="finalTotalCost">{totalCost ? totalCost.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }) : '₹0'}</span>
</div>
<div className="results-grid">
<div className="result-details">
<h3>Cost Breakdown</h3>
<table>
<thead>
<tr>
<th>Component</th>
<th>Allocation</th>
<th className="text-right">Cost (INR)</th>
</tr>
</thead>
<tbody>
{totalCost && Object.entries(mainBreakdown).map(([component, pct]) => {
const cost = (totalCost * pct) / 100
return (
<tr key={component}>
<td>{component}</td>
<td>{pct}%</td>
<td className="text-right">{cost.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</td>
</tr>
)
})}
</tbody>
</table>
</div>
<div className="chart-container">
<canvas id="budgetChart" ref={canvasRef}></canvas>
</div>
</div>


<div id="detailedBreakdownSection">
<h3 style={{ margin: '3rem 0 1rem', textAlign: 'center' }}>Detailed Component Breakdown</h3>
<div id="detailedComponents" className="detailed-breakdown-grid">
{totalCost && Object.entries(mainBreakdown).map(([component, pct]) => {
const componentCost = (totalCost * pct) / 100
const details = detailedBreakdown[component]
return (
<div key={component} className="component-card">
<h3>{component} Details</h3>
<table>
<tbody>
{details && Object.entries(details).map(([sub, subPct]) => {
const subCost = (componentCost * subPct) / 100
return (
<tr key={sub}>
<td>{sub}</td>
<td className="text-right">{subCost.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</td>
</tr>
)
})}
</tbody>
</table>
</div>
)
})}
</div>
</div>


<div className="action-buttons" id="actionButtons">
<button id="downloadPdfBtn" className="btn" onClick={downloadPdf}><i className="fas fa-file-pdf"></i> Download PDF</button>
<button id="shareBudget" className="btn btn-secondary" onClick={shareBudget}><i className="fas fa-share-alt"></i> Share Budget</button>
<button id="resetBudget" className="btn btn-secondary" onClick={resetAll}><i className="fas fa-sync-alt"></i> Reset</button>
</div>
</div>
</div>

</section>
)
}