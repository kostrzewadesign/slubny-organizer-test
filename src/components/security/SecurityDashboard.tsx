import { Shield, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSecurityHardening } from '@/hooks/use-security-hardening';

export function SecurityDashboard() {
  const { rlsVerification, securityStatus, lastChecked, runManualVerification } = useSecurityHardening();

  const getStatusIcon = () => {
    switch (securityStatus) {
      case 'secure':
        return <CheckCircle className="h-5 w-5 text-primary" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <RefreshCw className="h-5 w-5 animate-spin text-muted" />;
    }
  };

  const getStatusText = () => {
    switch (securityStatus) {
      case 'secure':
        return 'Bezpieczne';
      case 'warning':
        return 'Ostrzeżenia';
      case 'error':
        return 'Błąd';
      default:
        return 'Sprawdzanie...';
    }
  };

  const getStatusColor = () => {
    switch (securityStatus) {
      case 'secure':
        return 'bg-primary/10 text-primary';
      case 'warning':
        return 'bg-warning/10 text-warning';
      case 'error':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted/10 text-muted';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Bezpieczeństwo Systemu</CardTitle>
          </div>
          <Badge className={getStatusColor()}>
            {getStatusIcon()}
            <span className="ml-1">{getStatusText()}</span>
          </Badge>
        </div>
        <CardDescription>
          Status zabezpieczeń i izolacji danych
          {lastChecked && (
            <span className="block text-xs text-muted mt-1">
              Ostatnia weryfikacja: {lastChecked.toLocaleString('pl-PL')}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rlsVerification && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Weryfikacja RLS (Row Level Security)</h4>
            <div className="grid gap-2">
              {rlsVerification.map((table: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/5">
                  <span className="text-sm font-mono">{table.table_name}</span>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={table.test_result === 'SECURE' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {table.test_result === 'SECURE' ? 'Bezpieczne' : 'Wymaga uwagi'}
                    </Badge>
                    <span className="text-xs text-muted">
                      {table.policy_count} polic{table.policy_count === 1 ? 'ja' : table.policy_count < 5 ? 'je' : 'ji'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runManualVerification}
            disabled={securityStatus === 'loading'}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${securityStatus === 'loading' ? 'animate-spin' : ''}`} />
            Sprawdź ponownie
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}