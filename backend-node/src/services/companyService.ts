import { query } from '../config/db.js';
import { ServiceIssue } from '../types/index.js';

function round(val: number, places: number): number {
  if (Number.isNaN(val) || !Number.isFinite(val)) return 0.0;
  const factor = Math.pow(10, places);
  return Math.round(val * factor) / factor;
}

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100.0 : 0.0;
  const diff = current - previous;
  return round((diff / previous) * 100.0, 1);
}

export class CompanyService {
  async getDashboardSummary() {
    const salesRes = await query('SELECT * FROM vehicle_sales');
    const vehiclesRes = await query('SELECT * FROM vehicles');
    const assessmentsRes = await query('SELECT * FROM battery_analyses');
    const servicesRes = await query('SELECT * FROM service_records');
    const issuesRes = await query('SELECT * FROM service_issues');

    const totalVehiclesSold = salesRes.rows.length;
    const activeVehicles = vehiclesRes.rows.length;
    const totalAssessments = assessmentsRes.rows.length;
    const serviceVisits = servicesRes.rows.length;
    const openIssues = issuesRes.rows.filter((i) => !i.resolved_date).length;

    // Average SoH from latest assessment per vehicle
    let avgSoh = 0.0;
    let countWithSoh = 0;
    for (const v of vehiclesRes.rows) {
      const vAss = assessmentsRes.rows
        .filter((a) => a.vehicle_id && a.vehicle_id.toLowerCase() === v.vehicle_id.toLowerCase())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      if (vAss.length > 0) {
        avgSoh += Number(vAss[0].soh);
        countWithSoh++;
      }
    }
    avgSoh = countWithSoh > 0 ? round(avgSoh / countWithSoh, 1) : 0.0;

    // Time ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Sales MoM
    const salesThisMonth = salesRes.rows.filter((s) => new Date(s.sale_date) > thirtyDaysAgo).length;
    const salesLastMonth = salesRes.rows.filter(
      (s) => new Date(s.sale_date) > sixtyDaysAgo && new Date(s.sale_date) <= thirtyDaysAgo
    ).length;
    const salesChange = calculatePercentageChange(salesThisMonth, salesLastMonth);

    // Assessments MoM
    const assessmentsThisMonth = assessmentsRes.rows.filter((a) => new Date(a.created_at) > thirtyDaysAgo).length;
    const assessmentsLastMonth = assessmentsRes.rows.filter(
      (a) => new Date(a.created_at) > sixtyDaysAgo && new Date(a.created_at) <= thirtyDaysAgo
    ).length;
    const assessmentsChange = calculatePercentageChange(assessmentsThisMonth, assessmentsLastMonth);

    // Services MoM
    const servicesThisMonth = servicesRes.rows.filter((s) => new Date(s.service_date) > thirtyDaysAgo).length;
    const servicesLastMonth = servicesRes.rows.filter(
      (s) => new Date(s.service_date) > sixtyDaysAgo && new Date(s.service_date) <= thirtyDaysAgo
    ).length;
    const servicesChange = calculatePercentageChange(servicesThisMonth, servicesLastMonth);

    // Open Issues MoM
    const openIssuesThisMonth = issuesRes.rows.filter(
      (i) => !i.resolved_date && new Date(i.reported_date) > thirtyDaysAgo
    ).length;
    const openIssuesLastMonth = issuesRes.rows.filter(
      (i) => !i.resolved_date && new Date(i.reported_date) > sixtyDaysAgo && new Date(i.reported_date) <= thirtyDaysAgo
    ).length;
    const openIssuesChange = calculatePercentageChange(openIssuesThisMonth, openIssuesLastMonth);

    // SoH MoM
    let sohThisMonthSum = 0;
    let sohThisMonthCount = 0;
    let sohLastMonthSum = 0;
    let sohLastMonthCount = 0;

    for (const v of vehiclesRes.rows) {
      const vAss = assessmentsRes.rows
        .filter((a) => a.vehicle_id && a.vehicle_id.toLowerCase() === v.vehicle_id.toLowerCase())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const latestThis = vAss.find((a) => new Date(a.created_at) > thirtyDaysAgo);
      if (latestThis) {
        sohThisMonthSum += Number(latestThis.soh);
        sohThisMonthCount++;
      }

      const latestLast = vAss.find(
        (a) => new Date(a.created_at) > sixtyDaysAgo && new Date(a.created_at) <= thirtyDaysAgo
      );
      if (latestLast) {
        sohLastMonthSum += Number(latestLast.soh);
        sohLastMonthCount++;
      }
    }

    const avgSohThisMonth = sohThisMonthCount > 0 ? sohThisMonthSum / sohThisMonthCount : avgSoh;
    const avgSohLastMonth = sohLastMonthCount > 0 ? sohLastMonthSum / sohLastMonthCount : avgSoh;
    const sohChangePct = round(avgSohThisMonth - avgSohLastMonth, 1);

    return {
      totalVehiclesSold,
      salesChange,
      activeVehicles,
      activeVehiclesChange: calculatePercentageChange(activeVehicles, activeVehicles - salesThisMonth),
      totalBatteryAssessments: totalAssessments,
      assessmentsChange,
      serviceVisits,
      servicesChange,
      openIssues,
      openIssuesChange,
      avgBatterySoh: avgSoh,
      sohChange: sohChangePct
    };
  }

  async getMonthlySales(range = '12 months', modelFilter?: string) {
    let sales = (await query('SELECT * FROM vehicle_sales')).rows;

    if (modelFilter && modelFilter.trim().length > 0 && modelFilter.trim().toLowerCase() !== 'all models') {
      const trimmed = modelFilter.trim().toLowerCase();
      sales = sales.filter((s) => s.model.toLowerCase().includes(trimmed) || trimmed.includes(s.model.toLowerCase()));
    }

    let monthsCount = 12;
    if (range.toLowerCase() === '6 months') {
      monthsCount = 6;
    } else if (range.toLowerCase() === 'this year') {
      monthsCount = new Date().getMonth() + 1;
    }

    const result: { name: string; sales: number }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const targetYear = d.getFullYear();
      const targetMonth = d.getMonth();

      const count = sales.filter((s) => {
        const sd = new Date(s.sale_date);
        return sd.getFullYear() === targetYear && sd.getMonth() === targetMonth;
      }).length;

      result.push({
        name: `${monthNames[targetMonth]} ${targetYear}`,
        sales: count
      });
    }

    return result;
  }

  async getModelSalesPerformance() {
    const sales = (await query('SELECT * FROM vehicle_sales')).rows;
    const salesByModel: Record<string, number> = {};

    for (const s of sales) {
      salesByModel[s.model] = (salesByModel[s.model] || 0) + 1;
    }

    const rankings: { model: string; sold: number }[] = [];
    let mostSoldModel = 'No Sales yet';
    let mostSoldCount = 0;
    let leastSoldModel = 'No Sales yet';
    let leastSoldCount = Number.MAX_SAFE_INTEGER;

    for (const [model, count] of Object.entries(salesByModel)) {
      rankings.push({ model, sold: count });
      if (count > mostSoldCount) {
        mostSoldCount = count;
        mostSoldModel = model;
      }
      if (count < leastSoldCount) {
        leastSoldCount = count;
        leastSoldModel = model;
      }
    }

    if (rankings.length === 0) {
      leastSoldModel = 'No Sales yet';
      leastSoldCount = 0;
    }

    rankings.sort((a, b) => b.sold - a.sold);

    return {
      rankings,
      mostSoldModel,
      mostSoldCount,
      leastSoldModel,
      leastSoldCount
    };
  }

  async getAvailableModels(): Promise<string[]> {
    const res = await query('SELECT DISTINCT model FROM vehicles WHERE model IS NOT NULL ORDER BY model ASC');
    return res.rows.map((r) => r.model);
  }

  async getModelAnalytics(modelName: string) {
    const vehicles = (await query('SELECT * FROM vehicles WHERE LOWER(model) = $1', [modelName.toLowerCase()])).rows;
    const sales = (await query('SELECT * FROM vehicle_sales WHERE LOWER(model) = $1', [modelName.toLowerCase()])).rows;
    const services = (await query('SELECT * FROM service_records WHERE LOWER(model) = $1', [modelName.toLowerCase()])).rows;
    const issues = (await query('SELECT * FROM service_issues WHERE LOWER(model) = $1', [modelName.toLowerCase()])).rows;

    let avgSoh = 0.0;
    let avgAge = 0.0;
    let avgCycles = 0.0;
    let sohCount = 0;

    for (const v of vehicles) {
      const aRes = await query(
        'SELECT * FROM battery_analyses WHERE LOWER(vehicle_id) = $1 ORDER BY created_at DESC LIMIT 1',
        [v.vehicle_id.toLowerCase()]
      );
      if (aRes.rows.length > 0) {
        const latest = aRes.rows[0];
        avgSoh += Number(latest.soh);
        avgAge += Number(latest.battery_age);
        avgCycles += Number(latest.charging_cycles);
        sohCount++;
      }
    }

    avgSoh = sohCount > 0 ? round(avgSoh / sohCount, 1) : 0.0;
    avgAge = sohCount > 0 ? round(avgAge / sohCount, 1) : 0.0;
    avgCycles = sohCount > 0 ? round(avgCycles / sohCount, 0) : 0.0;

    // Service intervals
    let avgServiceIntervalMonths = 0.0;
    let intervalCount = 0;

    for (const v of vehicles) {
      const vServices = (
        await query(
          'SELECT * FROM service_records WHERE LOWER(vehicle_id) = $1 ORDER BY service_date ASC',
          [v.vehicle_id.toLowerCase()]
        )
      ).rows;

      if (vServices.length > 1) {
        for (let i = 1; i < vServices.length; i++) {
          const d1 = new Date(vServices[i - 1].service_date).getTime();
          const d2 = new Date(vServices[i].service_date).getTime();
          const days = (d2 - d1) / (1000 * 60 * 60 * 24);
          avgServiceIntervalMonths += days / 30.4;
          intervalCount++;
        }
      }
    }

    avgServiceIntervalMonths = intervalCount > 0 ? round(avgServiceIntervalMonths / intervalCount, 1) : 0.0;
    if (avgServiceIntervalMonths === 0.0 && vehicles.length > 0 && services.length > 0) {
      avgServiceIntervalMonths = round((avgAge * 12.0) / (services.length / vehicles.length), 1);
    }

    return {
      model: modelName,
      totalSold: sales.length,
      activeVehicles: vehicles.length,
      avgBatterySoh: avgSoh,
      avgBatteryAge: avgAge,
      avgChargingCycles: Math.round(avgCycles),
      serviceVisits: services.length,
      reportedProblems: issues.length,
      avgServiceInterval: avgServiceIntervalMonths
    };
  }

  async getBatteryHealthAnalytics() {
    const models = await this.getAvailableModels();
    const result: any[] = [];

    for (const model of models) {
      const vehicles = (await query('SELECT * FROM vehicles WHERE LOWER(model) = $1', [model.toLowerCase()])).rows;
      if (vehicles.length === 0) continue;

      let totalSoh = 0.0;
      let totalCapacity = 0.0;
      let totalAge = 0.0;
      let totalCycles = 0.0;
      let count = 0;

      for (const v of vehicles) {
        const aRes = await query(
          'SELECT * FROM battery_analyses WHERE LOWER(vehicle_id) = $1 ORDER BY created_at DESC LIMIT 1',
          [v.vehicle_id.toLowerCase()]
        );
        if (aRes.rows.length > 0) {
          const latest = aRes.rows[0];
          totalSoh += Number(latest.soh);
          const origCap = Number(latest.original_capacity);
          const usableCap = Number(latest.current_usable_capacity);
          totalCapacity += origCap > 0 ? (usableCap / origCap) * 100.0 : 0.0;
          totalAge += Number(latest.battery_age);
          totalCycles += Number(latest.charging_cycles);
          count++;
        }
      }

      if (count === 0) continue;

      const avgSoh = round(totalSoh / count, 1);
      const avgCapacity = round(totalCapacity / count, 1);
      const avgAge = round(totalAge / count, 1);
      const avgCycles = round(totalCycles / count, 0);

      const issuesCount = (
        await query('SELECT COUNT(*) FROM service_issues WHERE LOWER(model) = $1', [model.toLowerCase()])
      ).rows[0].count;
      const problemRate = round((parseInt(issuesCount, 10) / vehicles.length) * 100.0, 1);

      result.push({
        model,
        avgSoh,
        avgCapacityRetained: avgCapacity,
        avgAge,
        avgCycles: Math.round(avgCycles),
        problemRate
      });
    }

    return result;
  }

  async getServiceAnalytics() {
    const services = (await query('SELECT * FROM service_records')).rows;
    const issues = (await query('SELECT * FROM service_issues')).rows;
    const vehicles = (await query('SELECT * FROM vehicles')).rows;
    const sales = (await query('SELECT * FROM vehicle_sales')).rows;

    const totalVisits = services.length;
    if (totalVisits === 0) {
      return {
        totalServiceVisits: 0,
        avgServiceFrequencyMonths: 0.0,
        mostServicedModel: 'None',
        mostCommonProblem: 'None',
        avgRepairTime: 0.0,
        repeatServiceRate: 0.0,
        lifecycleJourney: {}
      };
    }

    let repairSum = 0;
    let repairCount = 0;
    let repeatVisits = 0;
    const modelVisits: Record<string, number> = {};

    for (const s of services) {
      if (s.repair_time_hours != null) {
        repairSum += Number(s.repair_time_hours);
        repairCount++;
      }
      if (s.is_repeat_visit) {
        repeatVisits++;
      }
      modelVisits[s.model] = (modelVisits[s.model] || 0) + 1;
    }

    const avgRepairTime = repairCount > 0 ? round(repairSum / repairCount, 1) : 0.0;
    const repeatServiceRate = round((repeatVisits / totalVisits) * 100.0, 1);

    let mostServicedModel = 'None';
    let maxServiced = 0;
    for (const [m, count] of Object.entries(modelVisits)) {
      if (count > maxServiced) {
        maxServiced = count;
        mostServicedModel = m;
      }
    }

    const problemCounts: Record<string, number> = {};
    for (const i of issues) {
      problemCounts[i.issue_type] = (problemCounts[i.issue_type] || 0) + 1;
    }
    let mostCommonProblem = 'None';
    let maxProb = 0;
    for (const [p, count] of Object.entries(problemCounts)) {
      if (count > maxProb) {
        maxProb = count;
        mostCommonProblem = p;
      }
    }

    // Lifecycle journey
    let reachedFirstService = 0;
    let totalDaysToFirst = 0;
    let firstServiceAvgSoh = 0;
    let requiringRepair = 0;
    let repeatServiceVisitsCount = 0;
    let problemsAfterServiceCount = 0;

    for (const v of vehicles) {
      const vServices = services
        .filter((s) => s.vehicle_id && s.vehicle_id.toLowerCase() === v.vehicle_id.toLowerCase())
        .sort((a, b) => new Date(a.service_date).getTime() - new Date(b.service_date).getTime());

      if (vServices.length > 0) {
        reachedFirstService++;
        const first = vServices[0];
        const vSale = sales.find((s) => s.vehicle_id && s.vehicle_id.toLowerCase() === v.vehicle_id.toLowerCase());
        if (vSale) {
          const days =
            (new Date(first.service_date).getTime() - new Date(vSale.sale_date).getTime()) / (1000 * 60 * 60 * 24);
          totalDaysToFirst += days;
        }

        firstServiceAvgSoh += Number(first.battery_soh || 0);

        const issuesInFirst = issues.filter((i) => i.service_record_id === first.id).length;
        if (issuesInFirst > 0) {
          requiringRepair++;
        }

        if (vServices.length > 1) {
          repeatServiceVisitsCount += vServices.length - 1;
          const postProblems = issues.filter(
            (i) =>
              i.vehicle_id &&
              i.vehicle_id.toLowerCase() === v.vehicle_id.toLowerCase() &&
              new Date(i.reported_date) > new Date(first.service_date)
          ).length;
          problemsAfterServiceCount += postProblems;
        }
      }
    }

    const avgMonthsToFirstService =
      reachedFirstService > 0 ? round(totalDaysToFirst / reachedFirstService / 30.4, 1) : 0.0;
    const avgSohAtFirstService =
      reachedFirstService > 0 ? round(firstServiceAvgSoh / reachedFirstService, 1) : 0.0;

    return {
      totalServiceVisits: totalVisits,
      avgServiceFrequencyMonths: avgMonthsToFirstService || 6.0,
      mostServicedModel,
      mostCommonProblem,
      avgRepairTime,
      repeatServiceRate,
      lifecycleJourney: {
        reachedFirstService,
        avgMonthsToFirstService,
        avgSohAtFirstService,
        requiringRepairCount: requiringRepair,
        repeatServiceVisitsCount,
        problemsAfterServiceCount
      }
    };
  }

  async getCustomerProblemAnalytics() {
    const issues = (await query('SELECT * FROM service_issues')).rows;
    const vehicles = (await query('SELECT * FROM vehicles')).rows;
    const assessments = (await query('SELECT * FROM battery_analyses')).rows;
    const services = (await query('SELECT * FROM service_records')).rows;

    const countsByType: Record<string, any[]> = {};
    for (const i of issues) {
      if (!countsByType[i.issue_type]) countsByType[i.issue_type] = [];
      countsByType[i.issue_type].push(i);
    }

    const result: any[] = [];
    const totalVehiclesCount = vehicles.length;
    const now = new Date();

    for (const [issueType, typeIssues] of Object.entries(countsByType)) {
      const distinctVehicles = new Set(typeIssues.map((i) => i.vehicle_id.toLowerCase())).size;
      const pctOfTotal = totalVehiclesCount > 0 ? round((distinctVehicles / totalVehiclesCount) * 100.0, 1) : 0.0;

      // Model breakdown
      const affectedModels: Record<string, number> = {};
      for (const i of typeIssues) {
        affectedModels[i.model] = (affectedModels[i.model] || 0) + 1;
      }

      // Monthly trend (last 6 months)
      const monthlyTrend: number[] = [];
      for (let m = 5; m >= 0; m--) {
        const target = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const y = target.getFullYear();
        const mon = target.getMonth();
        const count = typeIssues.filter((i) => {
          const id = new Date(i.reported_date);
          return id.getFullYear() === y && id.getMonth() === mon;
        }).length;
        monthlyTrend.push(count);
      }

      // Avg SOH & Age
      let avgSoh = 0.0;
      let avgAge = 0.0;
      let countWithData = 0;

      for (const issue of typeIssues) {
        const vAssessments = assessments
          .filter((a) => a.vehicle_id && a.vehicle_id.toLowerCase() === issue.vehicle_id.toLowerCase())
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        if (vAssessments.length > 0) {
          let closest = vAssessments[0];
          let minDiff = Math.abs(new Date(closest.created_at).getTime() - new Date(issue.reported_date).getTime());
          for (const a of vAssessments) {
            const diff = Math.abs(new Date(a.created_at).getTime() - new Date(issue.reported_date).getTime());
            if (diff < minDiff) {
              minDiff = diff;
              closest = a;
            }
          }
          avgSoh += Number(closest.soh);
          avgAge += Number(closest.battery_age);
          countWithData++;
        }
      }

      const finalAvgSoh = countWithData > 0 ? round(avgSoh / countWithData, 1) : 0.0;
      const finalAvgAge = countWithData > 0 ? round(avgAge / countWithData, 1) : 0.0;

      // Complaints list
      const complaintsList = typeIssues
        .map((iss) => ({
          id: iss.id,
          vehicleId: iss.vehicle_id,
          model: iss.model,
          manufacturer: iss.manufacturer,
          issueType: iss.issue_type,
          severity: iss.severity,
          description: iss.description,
          reportedDate: iss.reported_date,
          resolvedDate: iss.resolved_date,
          status: iss.resolved_date ? 'RESOLVED' : 'ACTIVE'
        }))
        .sort((a, b) => new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime());

      result.push({
        problem: issueType,
        count: typeIssues.length,
        affectedVehicles: distinctVehicles,
        affectedUsersCount: distinctVehicles,
        percentageOfTotal: pctOfTotal,
        monthlyTrend,
        avgVehicleAge: finalAvgAge,
        avgBatterySoh: finalAvgSoh,
        serviceVisitsCaused: typeIssues.length,
        affectedModels,
        complaints: complaintsList
      });
    }

    result.sort((a, b) => b.count - a.count);
    return result;
  }

  async registerComplaint(payload: Record<string, any>, userEmail?: string): Promise<ServiceIssue> {
    const vehicleId = (payload.vehicleId || payload.vehicle_id || 'UNKNOWN').trim();
    let model = (payload.model || 'EV 360').trim();
    let manufacturer = (payload.manufacturer || 'EV Company').trim();
    const issueType = (payload.issueType || payload.issue_type || 'Battery degradation').trim();
    const severity = (payload.severity || 'MEDIUM').trim();
    const description = (payload.description || '').trim();

    // Check if vehicle exists to use real metadata
    const vRes = await query('SELECT * FROM vehicles WHERE LOWER(vehicle_id) = $1', [vehicleId.toLowerCase()]);
    if (vRes.rows.length > 0) {
      const v = vRes.rows[0];
      if (v.model) model = v.model;
      if (v.manufacturer) manufacturer = v.manufacturer;
    }

    const insRes = await query(
      `INSERT INTO service_issues 
        (vehicle_id, manufacturer, model, issue_type, severity, description, reported_date, resolved_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [vehicleId, manufacturer, model, issueType, severity, description, new Date(), null]
    );

    const r = insRes.rows[0];
    return {
      id: r.id,
      serviceRecordId: r.service_record_id,
      vehicleId: r.vehicle_id,
      manufacturer: r.manufacturer,
      model: r.model,
      issueType: r.issue_type,
      severity: r.severity,
      description: r.description,
      reportedDate: r.reported_date,
      resolvedDate: r.resolved_date
    };
  }

  async getProblemDistributionByModel() {
    const issues = (await query('SELECT * FROM service_issues')).rows;
    const models = await this.getAvailableModels();
    const issueTypes = Array.from(new Set(issues.map((i) => i.issue_type)));

    const matrix: Record<string, Record<string, number>> = {};
    for (const it of issueTypes) {
      matrix[it] = {};
      for (const m of models) {
        matrix[it][m] = issues.filter(
          (i) => i.issue_type.toLowerCase() === it.toLowerCase() && i.model.toLowerCase() === m.toLowerCase()
        ).length;
      }
    }

    return {
      models,
      issueTypes,
      matrix
    };
  }

  async compareModels(m1Company: string, m1Model: string, m2Company: string, m2Model: string) {
    const m1Data = await this.getModelAnalytics(m1Model);
    const m2Data = await this.getModelAnalytics(m2Model);

    const m1Ass = (
      await query(
        'SELECT * FROM battery_analyses WHERE LOWER(model) = $1 ORDER BY created_at ASC',
        [m1Model.toLowerCase()]
      )
    ).rows;
    const m2Ass = (
      await query(
        'SELECT * FROM battery_analyses WHERE LOWER(model) = $1 ORDER BY created_at ASC',
        [m2Model.toLowerCase()]
      )
    ).rows;

    let m1CapRetention = 0.0;
    let m1AvgRange = 0.0;
    if (m1Ass.length > 0) {
      const sumCap = m1Ass.reduce((acc, a) => acc + (Number(a.current_usable_capacity) / Number(a.original_capacity)) * 100.0, 0);
      m1CapRetention = sumCap / m1Ass.length;
      m1AvgRange = m1Ass.reduce((acc, a) => acc + Number(a.average_range), 0) / m1Ass.length;
    }

    let m2CapRetention = 0.0;
    let m2AvgRange = 0.0;
    if (m2Ass.length > 0) {
      const sumCap = m2Ass.reduce((acc, a) => acc + (Number(a.current_usable_capacity) / Number(a.original_capacity)) * 100.0, 0);
      m2CapRetention = sumCap / m2Ass.length;
      m2AvgRange = m2Ass.reduce((acc, a) => acc + Number(a.average_range), 0) / m2Ass.length;
    }

    const m1Issues = (
      await query('SELECT * FROM service_issues WHERE LOWER(model) = $1', [m1Model.toLowerCase()])
    ).rows;
    const m2Issues = (
      await query('SELECT * FROM service_issues WHERE LOWER(model) = $1', [m2Model.toLowerCase()])
    ).rows;

    const m1ProbCounts: Record<string, number> = {};
    for (const i of m1Issues) m1ProbCounts[i.issue_type] = (m1ProbCounts[i.issue_type] || 0) + 1;
    let m1Common = 'None';
    let max1 = 0;
    for (const [p, c] of Object.entries(m1ProbCounts)) {
      if (c > max1) {
        max1 = c;
        m1Common = p;
      }
    }

    const m2ProbCounts: Record<string, number> = {};
    for (const i of m2Issues) m2ProbCounts[i.issue_type] = (m2ProbCounts[i.issue_type] || 0) + 1;
    let m2Common = 'None';
    let max2 = 0;
    for (const [p, c] of Object.entries(m2ProbCounts)) {
      if (c > max2) {
        max2 = c;
        m2Common = p;
      }
    }

    const m1VehCount = m1Data.activeVehicles;
    const m2VehCount = m2Data.activeVehicles;
    const m1ProbRate = m1VehCount > 0 ? round((m1Issues.length / m1VehCount) * 100.0, 1) : 0.0;
    const m2ProbRate = m2VehCount > 0 ? round((m2Issues.length / m2VehCount) * 100.0, 1) : 0.0;

    return {
      model1: {
        model: m1Model,
        sales: m1Data.totalSold,
        avgSoh: m1Data.avgBatterySoh,
        capacityRetention: round(m1CapRetention, 1),
        avgBatteryAge: m1Data.avgBatteryAge,
        chargingCycles: m1Data.avgChargingCycles,
        avgRange: round(m1AvgRange, 1),
        serviceVisits: m1Data.serviceVisits,
        problemRate: m1ProbRate,
        commonProblem: m1Common,
        serviceFrequency: m1Data.avgServiceInterval
      },
      model2: {
        model: m2Model,
        sales: m2Data.totalSold,
        avgSoh: m2Data.avgBatterySoh,
        capacityRetention: round(m2CapRetention, 1),
        avgBatteryAge: m2Data.avgBatteryAge,
        chargingCycles: m2Data.avgChargingCycles,
        avgRange: round(m2AvgRange, 1),
        serviceVisits: m2Data.serviceVisits,
        problemRate: m2ProbRate,
        commonProblem: m2Common,
        serviceFrequency: m2Data.avgServiceInterval
      }
    };
  }

  async getVehicleDetails(vehicleId: string) {
    if (!vehicleId || vehicleId.trim().length === 0) return {};
    const cleanId = vehicleId.trim().toLowerCase();

    const vRes = await query('SELECT * FROM vehicles WHERE LOWER(vehicle_id) = $1', [cleanId]);
    if (vRes.rows.length === 0) return {};

    const vehicle = vRes.rows[0];
    const actualId = vehicle.vehicle_id;

    const assessments = (
      await query(
        'SELECT * FROM battery_analyses WHERE LOWER(vehicle_id) = $1 ORDER BY created_at ASC',
        [cleanId]
      )
    ).rows;
    const services = (
      await query(
        'SELECT * FROM service_records WHERE LOWER(vehicle_id) = $1 ORDER BY service_date ASC',
        [cleanId]
      )
    ).rows;
    const issues = (
      await query('SELECT * FROM service_issues WHERE LOWER(vehicle_id) = $1', [cleanId])
    ).rows;
    const saleRes = await query(
      'SELECT * FROM vehicle_sales WHERE LOWER(vehicle_id) = $1',
      [cleanId]
    );

    const sale = saleRes.rows.length > 0 ? saleRes.rows[0] : null;
    const purchaseDate = sale ? sale.sale_date : vehicle.created_at;
    const purchasePrice = sale ? Number(sale.sale_price) : 0.0;

    let latestSoh = 0.0;
    let batteryAge = 0.0;
    let chargingCycles = 0;

    if (assessments.length > 0) {
      const latest = assessments[assessments.length - 1];
      latestSoh = Number(latest.soh);
      batteryAge = Number(latest.battery_age);
      chargingCycles = Number(latest.charging_cycles);
    }

    return {
      vehicleId: vehicle.vehicle_id,
      manufacturer: vehicle.manufacturer,
      model: vehicle.model,
      vehicleType: vehicle.vehicle_type,
      purchaseDate,
      purchasePrice,
      batteryAge,
      currentSoh: latestSoh,
      chargingCycles,
      serviceVisitsCount: services.length,
      serviceVisits: services,
      problemsReported: issues,
      assessments
    };
  }

  async getEngineeringInsights() {
    const issues = (await query('SELECT * FROM service_issues')).rows;
    const vehicles = (await query('SELECT * FROM vehicles')).rows;
    const assessments = (await query('SELECT * FROM battery_analyses')).rows;

    const insights: { type: string; text: string }[] = [];
    if (issues.length === 0 || vehicles.length === 0) return insights;

    // Insight 1: Charging issue rates compared between EV 360 and E1
    const m1Total = vehicles.filter((v) => v.model.toLowerCase() === 'ev 360').length;
    const m1Charging = issues.filter(
      (i) => i.model.toLowerCase() === 'ev 360' && i.issue_type.toLowerCase() === 'charging issue'
    ).length;
    const m1Rate = m1Total > 0 ? (m1Charging / m1Total) * 100.0 : 0.0;

    const m2Total = vehicles.filter((v) => v.model.toLowerCase() === 'e1').length;
    const m2Charging = issues.filter(
      (i) => i.model.toLowerCase() === 'e1' && i.issue_type.toLowerCase() === 'charging issue'
    ).length;
    const m2Rate = m2Total > 0 ? (m2Charging / m2Total) * 100.0 : 0.0;

    if (m1Rate > 0 && m2Rate > 0) {
      const timesHigher = round(m1Rate / m2Rate, 1);
      insights.push({
        type: 'WARNING',
        text: `EV 360 shows a ${m1Rate.toFixed(1)}% charging issue rate, which is ${timesHigher.toFixed(1)}× higher than E1 (${m2Rate.toFixed(1)}%).`
      });
    } else if (m1Rate > 0) {
      insights.push({
        type: 'WARNING',
        text: `EV 360 shows a ${m1Rate.toFixed(1)}% charging issue rate, representing elevated reports in this model.`
      });
    }

    // Insight 2: E1 maintains strong health
    const e1Ass = assessments.filter((a) => a.model.toLowerCase() === 'e1');
    if (e1Ass.length > 0) {
      const e1AvgSoh = e1Ass.reduce((acc, a) => acc + Number(a.soh), 0) / e1Ass.length;
      const e1AvgAge = e1Ass.reduce((acc, a) => acc + Number(a.battery_age), 0) / e1Ass.length;
      if (e1AvgSoh > 90.0 && e1AvgAge > 1.0) {
        insights.push({
          type: 'SUCCESS',
          text: `E1 maintains a strong average battery health of ${e1AvgSoh.toFixed(1)}% after ${e1AvgAge.toFixed(1)} years of operation.`
        });
      }
    }

    // Insight 3: Degradation after cycles
    const degraded = assessments.filter((a) => Number(a.soh) < 85.0);
    if (degraded.length > 0) {
      const avgCyclesAtDegradation = degraded.reduce((acc, a) => acc + Number(a.charging_cycles), 0) / degraded.length;
      insights.push({
        type: 'INFO',
        text: `Battery capacity degradation becomes statistically more common after approximately ${Math.round(avgCyclesAtDegradation)} charging cycles.`
      });
    }

    // Insight 4: Thermal related issues
    const thermalIssues = assessments.filter((a) => Number(a.average_temperature) > 30.0 && Number(a.soh) < 88.0);
    if (thermalIssues.length > 0) {
      insights.push({
        type: 'WARNING',
        text: 'Thermal-related capacity loss increases when average operating temperature exceeds the recommended range (25°C).'
      });
    }

    return insights;
  }
}

export const companyService = new CompanyService();
