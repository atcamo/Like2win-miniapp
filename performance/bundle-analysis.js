/**
 * Bundle Analysis Script
 * 
 * Analyzes Next.js bundle size and provides recommendations
 * for optimization and performance improvements.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Bundle analysis configuration
 */
const BUNDLE_SIZE_LIMITS = {
  // Maximum bundle sizes in KB
  'pages/_app.js': 250,
  'pages/index.js': 150,
  'pages/raffle.js': 200,
  
  // Maximum total size
  totalSize: 1000,
  
  // Maximum first load JS
  firstLoadJS: 300,
};

/**
 * Important dependencies to monitor
 */
const CRITICAL_DEPENDENCIES = [
  '@coinbase/onchainkit',
  '@farcaster/frame-sdk',
  'react',
  'react-dom',
  'next',
  'wagmi',
  'viem',
];

/**
 * Analyze Next.js build output
 */
function analyzeBundleSize() {
  console.log('🔍 Analyzing bundle size...\n');
  
  try {
    // Run Next.js build with bundle analyzer
    execSync('ANALYZE=true npm run build', { stdio: 'pipe' });
    
    // Read build output
    const buildOutputPath = path.join(process.cwd(), '.next/static');
    if (!fs.existsSync(buildOutputPath)) {
      throw new Error('Build output not found. Make sure build completed successfully.');
    }
    
    // Parse build stats
    const stats = parseBuildStats();
    
    // Generate report
    generateBundleReport(stats);
    
    // Check against limits
    checkBundleLimits(stats);
    
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    process.exit(1);
  }
}

/**
 * Parse Next.js build statistics
 */
function parseBuildStats() {
  try {
    // Read Next.js build manifest
    const manifestPath = path.join(process.cwd(), '.next/build-manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Read webpack stats if available
    const statsPath = path.join(process.cwd(), '.next/static/chunks/webpack-stats.json');
    let webpackStats = {};
    
    if (fs.existsSync(statsPath)) {
      webpackStats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    }
    
    return {
      manifest,
      webpackStats,
      buildTime: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('⚠️ Could not parse build stats:', error.message);
    return { manifest: {}, webpackStats: {}, buildTime: new Date().toISOString() };
  }
}

/**
 * Generate comprehensive bundle report
 */
function generateBundleReport(stats) {
  console.log('📊 Bundle Analysis Report\n');
  console.log('=' * 50);
  
  // Page analysis
  analyzePages(stats);
  
  // Dependency analysis
  analyzeDependencies();
  
  // Code splitting analysis
  analyzeCodeSplitting(stats);
  
  // Performance recommendations
  generateRecommendations(stats);
}

/**
 * Analyze individual pages
 */
function analyzePages(stats) {
  console.log('\n📄 Page Analysis:');
  console.log('-'.repeat(30));
  
  if (stats.manifest.pages) {
    Object.entries(stats.manifest.pages).forEach(([page, chunks]) => {
      const pageSize = calculatePageSize(chunks);
      const status = pageSize > (BUNDLE_SIZE_LIMITS[page] || 200) ? '❌' : '✅';
      
      console.log(`${status} ${page}: ${pageSize}KB`);
      
      if (Array.isArray(chunks)) {
        chunks.forEach(chunk => {
          console.log(`    - ${chunk}`);
        });
      }
    });
  }
}

/**
 * Calculate page size from chunks
 */
function calculatePageSize(chunks) {
  if (!Array.isArray(chunks)) return 0;
  
  return chunks.reduce((total, chunk) => {
    try {
      const chunkPath = path.join(process.cwd(), '.next/static/chunks', chunk);
      if (fs.existsSync(chunkPath)) {
        const stats = fs.statSync(chunkPath);
        return total + Math.round(stats.size / 1024);
      }
    } catch (error) {
      // Chunk file not found or inaccessible
    }
    return total;
  }, 0);
}

/**
 * Analyze critical dependencies
 */
function analyzeDependencies() {
  console.log('\n📦 Critical Dependencies:');
  console.log('-'.repeat(30));
  
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
    );
    
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    CRITICAL_DEPENDENCIES.forEach(dep => {
      if (dependencies[dep]) {
        console.log(`✅ ${dep}: ${dependencies[dep]}`);
      } else {
        console.log(`⚠️ ${dep}: Not found`);
      }
    });
    
    // Check for potentially large dependencies
    const largeDependencies = [
      'lodash',
      'moment',
      'rxjs',
      '@material-ui/core',
      'antd',
    ];
    
    const foundLargeDeps = largeDependencies.filter(dep => dependencies[dep]);
    if (foundLargeDeps.length > 0) {
      console.log('\n⚠️ Large dependencies detected:');
      foundLargeDeps.forEach(dep => {
        console.log(`   - ${dep}: Consider tree-shaking or alternatives`);
      });
    }
    
  } catch (error) {
    console.warn('Could not analyze dependencies:', error.message);
  }
}

/**
 * Analyze code splitting effectiveness
 */
function analyzeCodeSplitting(stats) {
  console.log('\n✂️ Code Splitting Analysis:');
  console.log('-'.repeat(30));
  
  try {
    const chunksDir = path.join(process.cwd(), '.next/static/chunks');
    
    if (fs.existsSync(chunksDir)) {
      const chunks = fs.readdirSync(chunksDir)
        .filter(file => file.endsWith('.js'))
        .map(file => {
          const filePath = path.join(chunksDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: Math.round(stats.size / 1024),
          };
        })
        .sort((a, b) => b.size - a.size);
      
      console.log('Largest chunks:');
      chunks.slice(0, 10).forEach(chunk => {
        const status = chunk.size > 100 ? '⚠️' : '✅';
        console.log(`${status} ${chunk.name}: ${chunk.size}KB`);
      });
      
      const totalChunks = chunks.length;
      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
      
      console.log(`\nTotal chunks: ${totalChunks}`);
      console.log(`Total size: ${totalSize}KB`);
      console.log(`Average chunk size: ${Math.round(totalSize / totalChunks)}KB`);
    }
    
  } catch (error) {
    console.warn('Could not analyze code splitting:', error.message);
  }
}

/**
 * Generate performance recommendations
 */
function generateRecommendations(stats) {
  console.log('\n💡 Performance Recommendations:');
  console.log('-'.repeat(30));
  
  const recommendations = [];
  
  // Bundle size recommendations
  if (calculateTotalBundleSize() > BUNDLE_SIZE_LIMITS.totalSize) {
    recommendations.push('Consider lazy loading components with React.lazy()');
    recommendations.push('Implement route-based code splitting');
    recommendations.push('Remove unused dependencies and code');
  }
  
  // Dependency recommendations
  recommendations.push('Use dynamic imports for heavy components');
  recommendations.push('Consider using lighter alternatives for large dependencies');
  recommendations.push('Implement tree shaking for unused code elimination');
  
  // Caching recommendations
  recommendations.push('Configure proper caching headers for static assets');
  recommendations.push('Use CDN for static asset delivery');
  recommendations.push('Implement service worker for offline functionality');
  
  // Image optimization
  recommendations.push('Optimize images using Next.js Image component');
  recommendations.push('Use WebP format for better compression');
  recommendations.push('Implement lazy loading for images');
  
  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });
}

/**
 * Check bundle sizes against limits
 */
function checkBundleLimits(stats) {
  console.log('\n🎯 Bundle Size Compliance:');
  console.log('-'.repeat(30));
  
  const totalSize = calculateTotalBundleSize();
  const firstLoadJS = calculateFirstLoadJS();
  
  // Check total size
  const totalStatus = totalSize <= BUNDLE_SIZE_LIMITS.totalSize ? '✅' : '❌';
  console.log(`${totalStatus} Total bundle size: ${totalSize}KB (limit: ${BUNDLE_SIZE_LIMITS.totalSize}KB)`);
  
  // Check first load JS
  const firstLoadStatus = firstLoadJS <= BUNDLE_SIZE_LIMITS.firstLoadJS ? '✅' : '❌';
  console.log(`${firstLoadStatus} First Load JS: ${firstLoadJS}KB (limit: ${BUNDLE_SIZE_LIMITS.firstLoadJS}KB)`);
  
  // Exit with error if limits exceeded
  if (totalSize > BUNDLE_SIZE_LIMITS.totalSize || firstLoadJS > BUNDLE_SIZE_LIMITS.firstLoadJS) {
    console.error('\n❌ Bundle size limits exceeded!');
    process.exit(1);
  }
  
  console.log('\n✅ All bundle size checks passed!');
}

/**
 * Calculate total bundle size
 */
function calculateTotalBundleSize() {
  try {
    const staticDir = path.join(process.cwd(), '.next/static');
    
    if (!fs.existsSync(staticDir)) return 0;
    
    let totalSize = 0;
    
    function calculateDirSize(dir) {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          calculateDirSize(filePath);
        } else if (file.endsWith('.js')) {
          totalSize += stats.size;
        }
      });
    }
    
    calculateDirSize(staticDir);
    
    return Math.round(totalSize / 1024);
  } catch (error) {
    console.warn('Could not calculate total bundle size:', error.message);
    return 0;
  }
}

/**
 * Calculate first load JS size
 */
function calculateFirstLoadJS() {
  try {
    const appChunkPath = path.join(process.cwd(), '.next/static/chunks/pages/_app.js');
    const indexChunkPath = path.join(process.cwd(), '.next/static/chunks/pages/index.js');
    
    let size = 0;
    
    if (fs.existsSync(appChunkPath)) {
      size += fs.statSync(appChunkPath).size;
    }
    
    if (fs.existsSync(indexChunkPath)) {
      size += fs.statSync(indexChunkPath).size;
    }
    
    return Math.round(size / 1024);
  } catch (error) {
    console.warn('Could not calculate first load JS size:', error.message);
    return 0;
  }
}

/**
 * Save analysis results
 */
function saveAnalysisResults(stats) {
  const results = {
    timestamp: new Date().toISOString(),
    totalBundleSize: calculateTotalBundleSize(),
    firstLoadJS: calculateFirstLoadJS(),
    limits: BUNDLE_SIZE_LIMITS,
    stats,
  };
  
  const outputPath = path.join(process.cwd(), 'performance/bundle-analysis-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log(`\n📄 Analysis results saved to: ${outputPath}`);
}

// Run analysis if called directly
if (require.main === module) {
  analyzeBundleSize();
}

module.exports = {
  analyzeBundleSize,
  parseBuildStats,
  generateBundleReport,
  checkBundleLimits,
};