import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { FeaturedAssets } from '../components/FeaturedAssets';
import { HowItWorks } from '../components/HowItWorks';
import { StatsSection } from '../components/StatsSection';
import { ValidatorCard } from '../components/ValidatorCard';
import { mockValidators } from '../data/mockData';
import { Button } from '../components/ui/Button';
import { Header } from '../components/layout/Header';

const HomePage = () => {
  // Show only the top 3 featured validators
  const featuredValidators = mockValidators.slice(0, 3);
  
  return (
    <div>
      <Header />
      <HeroSection />
      <StatsSection />
      <FeaturedAssets />
      <HowItWorks />
      
      {/* Featured Validators Section */}
      <section className="py-16 bg-gradient-to-b from-neutral-50 to-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary-800">Trusted Validators</h2>
            <p className="mt-3 text-neutral-600 max-w-2xl mx-auto">
              Our network of validators ensures the authenticity and quality of every tokenized asset
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredValidators.map(validator => (
              <ValidatorCard key={validator.id} validator={validator} />
            ))}
          </div>
          
          <div className="mt-10 text-center">
            <Button variant="secondary">View All Validators</Button>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-primary-800 text-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Tokenize Your Asset?</h2>
            <p className="text-lg text-neutral-300 mb-8">
              Join our growing community of asset owners and traders in the decentralized marketplace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                className="bg-secondary-500 hover:bg-secondary-600 text-white"
                size="lg"
              >
                Start Tokenizing
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                size="lg"
              >
                Explore Marketplace
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;