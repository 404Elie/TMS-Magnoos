import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Users, TrendingUp, Shield, CheckCircle, Calendar } from "lucide-react";
import logoPath from "@assets/Magnoos-Logo (3)_1756107685181.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src={logoPath} alt="Magnoos Logo" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-xl font-bold text-magnoos-dark">Magnoos</h1>
                <p className="text-xs text-gray-500">Travel Management</p>
              </div>
            </div>
            
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-magnoos-blue hover:bg-magnoos-dark-blue text-white"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-magnoos-dark mb-6">
            Enterprise Travel
            <span className="block text-magnoos-blue">Management System</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Streamline travel requests, approvals, and budget management with role-based access 
            and comprehensive tracking for managers, project managers, and operations teams.
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            size="lg"
            className="bg-magnoos-blue hover:bg-magnoos-dark-blue text-white px-8 py-3 text-lg"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-magnoos-dark mb-12">
            Powerful Features for Every Role
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Manager Features */}
            <Card className="border-l-4 border-l-magnoos-blue">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-magnoos-blue" />
                  </div>
                  <CardTitle className="text-magnoos-dark">Manager Portal</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 mb-4">
                  Submit and track travel requests with ease
                </CardDescription>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Submit travel requests</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Track request status</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Select users and projects</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Personal dashboard</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* PM Features */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-magnoos-dark">PM Dashboard</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 mb-4">
                  Approve requests and analyze project travel
                </CardDescription>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Approve/reject requests</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Project analytics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Approval tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Team oversight</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Operations Features */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-magnoos-dark">Operations Hub</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 mb-4">
                  Manage bookings and track budgets
                </CardDescription>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Booking management</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Budget tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Financial analytics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Expense management</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-magnoos-dark mb-12">
            Why Choose Magnoos Travel Management?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-magnoos-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-magnoos-dark mb-2">Secure & Compliant</h3>
              <p className="text-gray-600">Enterprise-grade security with role-based access control</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-magnoos-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <Plane className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-magnoos-dark mb-2">Streamlined Process</h3>
              <p className="text-gray-600">From request to booking completion in one platform</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-magnoos-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-magnoos-dark mb-2">Budget Control</h3>
              <p className="text-gray-600">Comprehensive budget tracking and analytics</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-magnoos-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-magnoos-dark mb-2">Team Collaboration</h3>
              <p className="text-gray-600">Seamless workflow between all stakeholders</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-magnoos-blue">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Travel Management?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join teams who trust Magnoos for their corporate travel needs
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            size="lg"
            className="bg-white text-magnoos-blue hover:bg-gray-100 px-8 py-3 text-lg"
          >
            Sign In to Get Started
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-magnoos-dark py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src={logoPath} alt="Magnoos Logo" className="w-8 h-8 object-contain" />
            <span className="text-white font-semibold">Magnoos Travel Management</span>
          </div>
          <p className="text-gray-400">
            © 2025 Magnoos. All rights reserved. Enterprise travel management made simple.
          </p>
        </div>
      </footer>
    </div>
  );
}
