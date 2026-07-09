import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, DollarSign, Ruler, Dumbbell, Building2, MapPin } from 'lucide-react';
import type { ProposalOutputs as ProposalOutputsType } from '@/lib/superiorProposalAlgorithm';
import { formatCurrency, formatNumber } from '@/lib/superiorProposalAlgorithm';
import type { MultifamilyComp, FitnessComp } from '@/hooks/useProposalComps';

interface ProposalOutputsProps {
  outputs: ProposalOutputsType;
  multifamilyComps: MultifamilyComp[];
  fitnessComps: FitnessComp[];
  hasAddress: boolean;
  hasUnitsOrSF: boolean;
}

export function ProposalOutputsComponent({
  outputs,
  multifamilyComps,
  fitnessComps,
  hasAddress,
  hasUnitsOrSF
}: ProposalOutputsProps) {
  const { section1_budget, section2_squareFootage, section3_equipmentFocus } = outputs;

  return (
    <div className="space-y-6">
      {/* Section 1: Budget */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Recommended Fitness Equipment Budget
          </CardTitle>
        </CardHeader>
        <CardContent>
          {section1_budget.ok ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 rounded-lg bg-primary/10">
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(section1_budget.budget || 0)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Cost per SF</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(section1_budget.costPerSF || 0)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Property Class</p>
                  <p className="text-xl font-semibold">
                    Class {section1_budget.propertyClass}
                  </p>
                </div>
              </div>
              {section1_budget.budgetMultiplier !== 1 && (
                <p className="text-sm text-muted-foreground">
                  Budget adjusted by {((section1_budget.budgetMultiplier || 1) * 100 - 100).toFixed(0)}% 
                  based on demographic factors
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>{section1_budget.error || 'Needs Units or SF Override'}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Square Footage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            Recommended Fitness Center Square Footage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {section2_squareFootage.ok ? (
            <div className="space-y-4">
              <div className="text-center p-4 rounded-lg bg-primary/10">
                <p className="text-sm text-muted-foreground">Recommended SF</p>
                <p className="text-2xl font-bold text-primary">
                  {formatNumber(section2_squareFootage.squareFootage || 0)} sq ft
                </p>
                {section2_squareFootage.source === 'override' && (
                  <Badge variant="secondary" className="mt-2">Manual Override</Badge>
                )}
              </div>
              {section2_squareFootage.source === 'calculated' && (
                <div className="grid gap-2 md:grid-cols-4 text-sm">
                  <div className="p-2 rounded bg-muted text-center">
                    <p className="text-muted-foreground">Total Adults</p>
                    <p className="font-medium">{formatNumber(section2_squareFootage.totalAdults || 0)}</p>
                  </div>
                  <div className="p-2 rounded bg-muted text-center">
                    <p className="text-muted-foreground">Gym Users</p>
                    <p className="font-medium">{formatNumber(section2_squareFootage.totalGymUsers || 0)}</p>
                  </div>
                  <div className="p-2 rounded bg-muted text-center">
                    <p className="text-muted-foreground">Peak Users</p>
                    <p className="font-medium">{formatNumber(section2_squareFootage.peakGymUsers || 0)}</p>
                  </div>
                  <div className="p-2 rounded bg-muted text-center">
                    <p className="text-muted-foreground">Daily Peak</p>
                    <p className="font-medium">{formatNumber(section2_squareFootage.dailyPeakUsers || 0)}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>{section2_squareFootage.error || 'Needs Units or SF Override'}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Equipment Focus */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Recommended Equipment Focus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {section3_equipmentFocus.topPriorities.map((priority, index) => (
              <Badge 
                key={priority.type} 
                variant={index === 0 ? "default" : "secondary"}
                className="text-sm"
              >
                {priority.type}
              </Badge>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-sm font-medium mb-1">Activity Profile</p>
            <Badge variant="outline">{section3_equipmentFocus.activityLevel}</Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Design Guidance</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {section3_equipmentFocus.guidance.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Multifamily Comps */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-destructive" />
            Multifamily Comps
            {multifamilyComps.length > 0 && (
              <Badge variant="secondary">{multifamilyComps.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasAddress ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Enter an address and click "Find Comps" to see nearby communities</span>
            </div>
          ) : multifamilyComps.length === 0 ? (
            <p className="text-muted-foreground text-sm">No multifamily comps found in this area</p>
          ) : (
            <div className="space-y-3">
              {multifamilyComps.map((comp, index) => (
                <div key={index} className="p-3 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{comp.name}</h4>
                      <p className="text-sm text-muted-foreground">{comp.address}</p>
                    </div>
                    <Badge variant="outline">{comp.distance.toFixed(1)} mi</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {comp.inferredClass} ({comp.classConfidence})
                    </Badge>
                    {comp.amenitySignals.slice(0, 3).map((signal, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{signal}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 5: Fitness Comps */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            Fitness Facility Comps
            {fitnessComps.length > 0 && (
              <Badge variant="secondary">{fitnessComps.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasAddress ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Enter an address and click "Find Comps" to see nearby fitness facilities</span>
            </div>
          ) : fitnessComps.length === 0 ? (
            <p className="text-muted-foreground text-sm">No fitness facility comps found in this area</p>
          ) : (
            <div className="space-y-3">
              {fitnessComps.map((comp, index) => (
                <div key={index} className="p-3 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{comp.name}</h4>
                      <p className="text-sm text-muted-foreground">{comp.address}</p>
                      <p className="text-xs text-muted-foreground">{comp.type}</p>
                    </div>
                    <Badge variant="outline">{comp.distance.toFixed(1)} mi</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {comp.focusTags.slice(0, 4).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  {comp.complementGuidance.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">Opportunity: </span>
                      {comp.complementGuidance[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
