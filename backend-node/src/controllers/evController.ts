import { Request, Response } from 'express';
import { query } from '../config/db.js';
import { EvModel, EvDealer, EvServiceCenter } from '../types/index.js';

function mapEvModel(r: any): EvModel {
  return {
    id: r.id,
    company: r.company,
    model: r.model,
    vehicleType: r.vehicle_type,
    bodyType: r.body_type,
    minPrice: Number(r.min_price),
    maxPrice: Number(r.max_price),
    rangeKm: r.range_km,
    batteryCapacityKwh: r.battery_capacity_kwh != null ? Number(r.battery_capacity_kwh) : undefined,
    chargingTimeMins: r.charging_time_mins != null ? Number(r.charging_time_mins) : undefined,
    fastCharging: r.fast_charging,
    topSpeedKmh: r.top_speed_kmh != null ? Number(r.top_speed_kmh) : undefined,
    userRating: r.user_rating != null ? Number(r.user_rating) : undefined,
    reviewsCount: r.reviews_count != null ? Number(r.reviews_count) : undefined,
    warrantyYears: r.warranty_years != null ? Number(r.warranty_years) : undefined,
    safetyRating: r.safety_rating != null ? Number(r.safety_rating) : undefined,
    serviceCenterCount: r.service_center_count != null ? Number(r.service_center_count) : undefined,
    serviceCenterAvailabilityByCity: r.service_center_availability_by_city,
    positiveFactors: r.positive_factors,
    negativeFactors: r.negative_factors,
    availableCities: r.available_cities,
    imageUrl: r.image_url,
    estimatedRunningCostPerKm:
      r.estimated_running_cost_per_km != null ? Number(r.estimated_running_cost_per_km) : undefined
  };
}

export class EvController {
  async getAllEvs(req: Request, res: Response) {
    try {
      const dbRes = await query('SELECT * FROM ev_models ORDER BY id ASC');
      return res.json(dbRes.rows.map(mapEvModel));
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getEvById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const numId = Number(id);
      if (isNaN(numId)) {
        return res.status(404).json({ message: 'EV Model not found' });
      }
      const dbRes = await query('SELECT * FROM ev_models WHERE id = $1', [numId]);
      if (dbRes.rows.length === 0) {
        return res.status(404).json({ message: 'EV Model not found' });
      }
      return res.json(mapEvModel(dbRes.rows[0]));
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async recommendEvs(req: Request, res: Response) {
    try {
      const { budget, city, vehicleType, minRange, priority } = req.body;

      if (!budget || Number(budget) <= 0) {
        return res.status(400).json({ message: 'Invalid budget. Budget must be greater than 0.' });
      }
      if (!city || typeof city !== 'string' || city.trim().length === 0) {
        return res.status(400).json({ message: 'City is required.' });
      }

      const numBudget = Number(budget);
      const cleanCity = city.trim();

      const allEvs = (await query('SELECT * FROM ev_models')).rows.map(mapEvModel);
      const dealers = (await query('SELECT * FROM ev_dealers')).rows;
      const serviceCenters = (await query('SELECT * FROM ev_service_centers')).rows;

      const filterType = (vehicleType || 'ANY').toUpperCase();
      const filtered = allEvs.filter((ev) => {
        if (filterType === 'ANY') return true;
        return ev.vehicleType.toUpperCase() === filterType;
      });

      if (filtered.length === 0) {
        return res.json([]);
      }

      const results: any[] = [];

      for (const ev of filtered) {
        const localDealers = dealers
          .filter((d) => d.city.toLowerCase() === cleanCity.toLowerCase() && d.brand.toLowerCase() === ev.company.toLowerCase())
          .map((d) => ({
            id: d.id,
            name: d.name,
            city: d.city,
            brand: d.brand,
            address: d.address,
            phoneNumber: d.phone_number,
            rating: Number(d.rating)
          }));

        const localCenters = serviceCenters
          .filter((sc) => sc.city.toLowerCase() === cleanCity.toLowerCase() && sc.brand.toLowerCase() === ev.company.toLowerCase())
          .map((sc) => ({
            id: sc.id,
            name: sc.name,
            city: sc.city,
            brand: sc.brand,
            address: sc.address,
            phoneNumber: sc.phone_number,
            rating: Number(sc.rating)
          }));

        let localServiceCentersCount = localCenters.length;
        if (localServiceCentersCount === 0 && ev.serviceCenterCount) {
          const citiesStr = (ev.availableCities || '').toLowerCase();
          if (citiesStr.includes(cleanCity.toLowerCase())) {
            localServiceCentersCount = ev.serviceCenterCount;
          }
        }

        // A. Budget Fit
        let scoreBudgetVal = 0.0;
        if (ev.minPrice <= numBudget) {
          if (ev.maxPrice <= numBudget) {
            scoreBudgetVal = 100.0;
          } else {
            const rangeSize = ev.maxPrice - ev.minPrice;
            const excessCover = numBudget - ev.minPrice;
            scoreBudgetVal = 80.0 + 20.0 * (rangeSize > 0 ? excessCover / rangeSize : 1.0);
          }
        } else {
          const pctOver = (ev.minPrice - numBudget) / numBudget;
          scoreBudgetVal = Math.max(0.0, 70.0 - pctOver * 400.0);
        }
        const scoreBudget = Math.round(scoreBudgetVal);

        // B. Range suitability
        let expectedMaxRange = 150.0;
        if (ev.vehicleType.toUpperCase() === 'ELECTRIC_CAR') {
          expectedMaxRange = 600.0;
        } else if (ev.vehicleType.toUpperCase() === 'ELECTRIC_BIKE') {
          expectedMaxRange = 250.0;
        }
        let scoreRangeVal = Math.min(100.0, (ev.rangeKm / expectedMaxRange) * 100.0);
        if (minRange && ev.rangeKm < Number(minRange)) {
          scoreRangeVal *= 0.4;
        }
        const scoreRange = Math.round(scoreRangeVal);

        // C. Service Availability
        let scoreServiceVal = 20.0;
        if (localServiceCentersCount >= 2) {
          scoreServiceVal = 100.0;
        } else if (localServiceCentersCount === 1) {
          scoreServiceVal = 80.0;
        }
        const avCities = (ev.availableCities || '').toLowerCase();
        if (!avCities.includes(cleanCity.toLowerCase())) {
          scoreServiceVal = 0.0;
        }
        const scoreService = Math.round(scoreServiceVal);

        // D. User Reviews
        const scoreReviews = Math.round(ev.userRating ? (ev.userRating / 5.0) * 100.0 : 80.0);

        // E. Charging Speed
        let scoreChargingVal = 50.0;
        if (ev.chargingTimeMins && ev.chargingTimeMins > 0) {
          const expectedMinTime = ev.vehicleType.toUpperCase() === 'ELECTRIC_CAR' ? 120.0 : 180.0;
          const ratio = expectedMinTime / ev.chargingTimeMins;
          scoreChargingVal = Math.min(100.0, ratio * 100.0);
        }
        if (ev.fastCharging && ev.fastCharging.toLowerCase() !== 'no') {
          scoreChargingVal = Math.min(100.0, scoreChargingVal + 15.0);
        }
        const scoreCharging = Math.round(scoreChargingVal);

        // F. Overall Value
        const safetyFactor = ev.safetyRating ? (ev.safetyRating / 5.0) * 50.0 : 35.0;
        const warrantyFactor = ev.warrantyYears ? (ev.warrantyYears / 8.0) * 50.0 : 35.0;
        const scoreValue = Math.round(Math.min(100.0, safetyFactor + warrantyFactor));

        // Weights
        let wBudget = 0.25;
        let wRange = 0.15;
        let wService = 0.15;
        let wReviews = 0.1;
        let wCharging = 0.1;
        let wValue = 0.15;

        if (priority && typeof priority === 'string' && priority.trim().length > 0) {
          const p = priority.trim().toLowerCase();
          if (p.includes('price') || p.includes('budget')) {
            wBudget = 0.4;
            wRange = 0.12;
            wService = 0.12;
            wReviews = 0.08;
            wCharging = 0.08;
            wValue = 0.1;
          } else if (p.includes('range')) {
            wRange = 0.35;
            wBudget = 0.2;
            wService = 0.12;
            wReviews = 0.08;
            wCharging = 0.08;
            wValue = 0.1;
          } else if (p.includes('charging')) {
            wCharging = 0.3;
            wBudget = 0.2;
            wRange = 0.12;
            wService = 0.12;
            wReviews = 0.08;
            wValue = 0.1;
          } else if (p.includes('rating') || p.includes('reviews')) {
            wReviews = 0.3;
            wBudget = 0.2;
            wRange = 0.12;
            wService = 0.12;
            wCharging = 0.08;
            wValue = 0.1;
          }
        }

        const totalScore =
          scoreBudget * wBudget +
          scoreRange * wRange +
          scoreService * wService +
          scoreReviews * wReviews +
          scoreCharging * wCharging +
          scoreValue * wValue;
        const sumWeights = wBudget + wRange + wService + wReviews + wCharging + wValue;
        let finalOverall = totalScore / sumWeights;

        if (scoreServiceVal === 0.0) {
          finalOverall *= 0.1;
        }

        const overallMatchScore = Math.round(finalOverall);

        // Explanations & Considerations
        const explanation: string[] = [];
        const thingsToConsider: string[] = [];

        if (ev.minPrice <= numBudget) {
          explanation.push(
            `Base price fits comfortably within your budget (starts at ₹${ev.minPrice.toLocaleString('en-IN')} ex-showroom)`
          );
        } else {
          thingsToConsider.push(
            `Minimum price exceeds your budget by ₹${(ev.minPrice - numBudget).toLocaleString('en-IN')}`
          );
        }

        if (scoreServiceVal > 0.0) {
          explanation.push(`Available in ${cleanCity} with direct brand support and service accessibility`);
        } else {
          thingsToConsider.push(`Brand lacks localized service presence directly within ${cleanCity}`);
        }

        if (ev.rangeKm >= 300) {
          explanation.push(`Long highway range of ${ev.rangeKm} km on a single charge`);
        } else if (ev.rangeKm >= 120) {
          explanation.push(`Practical daily city driving range of ${ev.rangeKm} km`);
        } else {
          thingsToConsider.push(
            `Range of ${ev.rangeKm} km is shorter; suitable primarily for close proximity city commutes`
          );
        }

        if (ev.userRating && ev.userRating >= 4.4) {
          explanation.push(
            `Highly rated by customers (${ev.userRating}/5 stars) based on ${ev.reviewsCount} reviews`
          );
        }

        if (ev.fastCharging && ev.fastCharging.toLowerCase() !== 'no') {
          explanation.push(`Supports DC fast charging (${ev.fastCharging}) for quick battery top ups`);
        }

        if (ev.negativeFactors && ev.negativeFactors.trim().length > 0) {
          const negs = ev.negativeFactors.split(',');
          for (const neg of negs) {
            if (thingsToConsider.length < 3) thingsToConsider.push(neg.trim());
          }
        }

        results.push({
          ev,
          overallMatchScore,
          scoreBudget,
          scoreRange,
          scoreService,
          scoreReviews,
          scoreCharging,
          scoreValue,
          explanation,
          thingsToConsider,
          localDealers,
          localServiceCentersCount
        });
      }

      const top3 = results
        .filter((r) => r.overallMatchScore >= 15.0)
        .sort((a, b) => b.overallMatchScore - a.overallMatchScore)
        .slice(0, 3);

      return res.json(top3);
    } catch (err: any) {
      console.error('Error in recommendEvs:', err);
      return res.status(500).json({ message: err.message });
    }
  }

  async compareEvs(req: Request, res: Response) {
    try {
      const ev1Id = Number(req.query.ev1);
      const ev2Id = Number(req.query.ev2);
      const city = req.query.city as string | undefined;

      const r1 = await query('SELECT * FROM ev_models WHERE id = $1', [ev1Id]);
      const r2 = await query('SELECT * FROM ev_models WHERE id = $1', [ev2Id]);

      if (r1.rows.length === 0 || r2.rows.length === 0) {
        return res.status(400).json({ message: 'One or both EV Model IDs are invalid.' });
      }

      const m1 = mapEvModel(r1.rows[0]);
      const m2 = mapEvModel(r2.rows[0]);

      let recommendedModelName = `${m1.company} ${m1.model}`;
      let recommendedId = m1.id;
      const reasons: string[] = [];

      let score1 = 0;
      let score2 = 0;

      // Price comparison
      if (m1.minPrice < m2.minPrice) {
        score1 += 2;
        reasons.push(
          `${m1.company} ${m1.model} starts at a lower price point (₹${m1.minPrice.toLocaleString('en-IN')} vs ₹${m2.minPrice.toLocaleString('en-IN')})`
        );
      } else if (m2.minPrice < m1.minPrice) {
        score2 += 2;
        reasons.push(
          `${m2.company} ${m2.model} starts at a lower price point (₹${m2.minPrice.toLocaleString('en-IN')} vs ₹${m1.minPrice.toLocaleString('en-IN')})`
        );
      }

      // Range comparison
      if (m1.rangeKm > m2.rangeKm) {
        score1 += 2;
        reasons.push(`${m1.company} ${m1.model} offers superior range (${m1.rangeKm} km vs ${m2.rangeKm} km)`);
      } else if (m2.rangeKm > m1.rangeKm) {
        score2 += 2;
        reasons.push(`${m2.company} ${m2.model} offers superior range (${m2.rangeKm} km vs ${m1.rangeKm} km)`);
      }

      // Top Speed
      const ts1 = m1.topSpeedKmh || 0;
      const ts2 = m2.topSpeedKmh || 0;
      if (ts1 > ts2) {
        score1 += 1.5;
        reasons.push(`${m1.company} ${m1.model} provides a higher top speed of ${ts1} km/h`);
      } else if (ts2 > ts1) {
        score2 += 1.5;
        reasons.push(`${m2.company} ${m2.model} provides a higher top speed of ${ts2} km/h`);
      }

      // Ratings
      const ur1 = m1.userRating || 0;
      const ur2 = m2.userRating || 0;
      if (ur1 > ur2) {
        score1 += 1.5;
        reasons.push(
          `${m1.company} ${m1.model} holds stronger customer satisfaction ratings (${ur1}★ vs ${ur2}★)`
        );
      } else if (ur2 > ur1) {
        score2 += 1.5;
        reasons.push(
          `${m2.company} ${m2.model} holds stronger customer satisfaction ratings (${ur2}★ vs ${ur1}★)`
        );
      }

      // Service check
      if (city && city.trim().length > 0) {
        const scRes1 = await query(
          'SELECT COUNT(*) FROM ev_service_centers WHERE LOWER(city) = $1 AND LOWER(brand) = $2',
          [city.trim().toLowerCase(), m1.company.toLowerCase()]
        );
        const scRes2 = await query(
          'SELECT COUNT(*) FROM ev_service_centers WHERE LOWER(city) = $1 AND LOWER(brand) = $2',
          [city.trim().toLowerCase(), m2.company.toLowerCase()]
        );
        const count1 = parseInt(scRes1.rows[0].count, 10);
        const count2 = parseInt(scRes2.rows[0].count, 10);

        if (count1 > count2) {
          score1 += 2;
          reasons.push(
            `${m1.company} has better local brand service coverage in ${city} (${count1} vs ${count2} center(s))`
          );
        } else if (count2 > count1) {
          score2 += 2;
          reasons.push(
            `${m2.company} has better local brand service coverage in ${city} (${count2} vs ${count1} center(s))`
          );
        }
      }

      if (score2 > score1) {
        recommendedModelName = `${m2.company} ${m2.model}`;
        recommendedId = m2.id;
      }
      if (reasons.length === 0) {
        reasons.push('Both models present similar technical metrics and ex-showroom value.');
      }

      return res.json({
        ev1: m1,
        ev2: m2,
        recommendedEvId: recommendedId,
        recommendedEvName: recommendedModelName,
        comparisonScoreEv1: score1,
        comparisonScoreEv2: score2,
        reasons
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getDealers(req: Request, res: Response) {
    try {
      const city = req.query.city as string;
      const brand = req.query.brand as string | undefined;

      if (!city) {
        return res.status(400).json({ message: 'City is required' });
      }

      let dbRes;
      if (brand && brand.trim().length > 0) {
        dbRes = await query(
          'SELECT * FROM ev_dealers WHERE LOWER(city) = $1 AND LOWER(brand) = $2',
          [city.trim().toLowerCase(), brand.trim().toLowerCase()]
        );
      } else {
        dbRes = await query('SELECT * FROM ev_dealers WHERE LOWER(city) = $1', [city.trim().toLowerCase()]);
      }

      return res.json(
        dbRes.rows.map((d) => ({
          id: d.id,
          name: d.name,
          city: d.city,
          brand: d.brand,
          address: d.address,
          phoneNumber: d.phone_number,
          rating: Number(d.rating)
        }))
      );
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getServiceCenters(req: Request, res: Response) {
    try {
      const city = req.query.city as string;
      const brand = req.query.brand as string | undefined;

      if (!city) {
        return res.status(400).json({ message: 'City is required' });
      }

      let dbRes;
      if (brand && brand.trim().length > 0) {
        dbRes = await query(
          'SELECT * FROM ev_service_centers WHERE LOWER(city) = $1 AND LOWER(brand) = $2',
          [city.trim().toLowerCase(), brand.trim().toLowerCase()]
        );
      } else {
        dbRes = await query('SELECT * FROM ev_service_centers WHERE LOWER(city) = $1', [city.trim().toLowerCase()]);
      }

      return res.json(
        dbRes.rows.map((sc) => ({
          id: sc.id,
          name: sc.name,
          city: sc.city,
          brand: sc.brand,
          address: sc.address,
          phoneNumber: sc.phone_number,
          rating: Number(sc.rating)
        }))
      );
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }
}

export const evController = new EvController();
