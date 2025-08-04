import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Search, ArrowLeft } from "lucide-react";
import Button from "../components/ui/Button.tsx";

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 404 Number */}
          <div className="text-9xl font-bold text-gray-200 mb-4">404</div>

          {/* Error Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. It might have
            been moved, deleted, or you entered the wrong URL.
          </p>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link to="/">
              <Button size="lg" className="w-full">
                <Home className="w-5 h-5 mr-2" />
                Go Home
              </Button>
            </Link>

            <Link to="/products">
              <Button variant="outline" size="lg" className="w-full">
                <Search className="w-5 h-5 mr-2" />
                Browse Products
              </Button>
            </Link>
          </div>

          {/* Back Button */}
          <div className="mt-8">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Go back
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
