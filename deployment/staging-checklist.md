# Staging Deployment Checklist

## 🎯 **PRE-DEPLOYMENT VERIFICATION**

### **Code Quality & Testing**
- [ ] All unit tests passing (>95% coverage on critical paths)
- [ ] Integration tests passing (100% on API endpoints)
- [ ] E2E tests passing (100% on core user flows)
- [ ] Performance tests meet benchmarks
- [ ] Security scan completed (no high/critical vulnerabilities)
- [ ] Code review completed and approved
- [ ] Linting and formatting checks passed

### **Database Preparation**
- [ ] Database migrations tested locally
- [ ] Database backup created (if updating existing staging)
- [ ] Test data migration scripts ready
- [ ] Database connection strings updated for staging
- [ ] Verify database user permissions
- [ ] Index optimization queries prepared

### **Environment Configuration**
- [ ] All staging environment variables set
- [ ] API keys rotated for staging environment
- [ ] Third-party service endpoints updated (Farcaster, OnchainKit)
- [ ] Rate limiting configured appropriately
- [ ] CORS settings updated for staging domain
- [ ] SSL certificates ready

### **Dependencies & Build**
- [ ] All dependencies updated and tested
- [ ] Build process tested in staging-like environment
- [ ] Bundle size analysis completed
- [ ] Assets optimized and compressed
- [ ] CDN configuration updated
- [ ] Service worker updated (if applicable)

---

## 🔧 **DEPLOYMENT PROCESS**

### **Step 1: Infrastructure Setup**
```bash
# 1. Verify staging environment
curl -f https://staging.like2win.app/health || echo "Environment not ready"

# 2. Check database connectivity
npm run db:health-check -- --env staging

# 3. Verify external services
npm run verify-integrations -- --env staging
```

- [ ] Staging server accessible
- [ ] Database connection verified
- [ ] External APIs responding
- [ ] CDN configuration active

### **Step 2: Database Migration**
```bash
# 1. Create database backup
npm run db:backup -- --env staging

# 2. Run migrations
npm run db:migrate -- --env staging

# 3. Seed test data
npm run db:seed -- --env staging --test-data

# 4. Verify data integrity
npm run db:verify -- --env staging
```

- [ ] Database backup created
- [ ] Migrations executed successfully
- [ ] Test data seeded
- [ ] Data integrity verified
- [ ] Rollback plan tested

### **Step 3: Application Deployment**
```bash
# 1. Build application
npm run build

# 2. Run pre-deployment checks
npm run pre-deploy

# 3. Deploy to staging
npm run deploy:staging

# 4. Run post-deployment verification
npm run verify:staging
```

- [ ] Build completed without errors
- [ ] Assets uploaded to CDN
- [ ] Application deployed
- [ ] Health checks passing
- [ ] Environment variables loaded correctly

### **Step 4: Service Verification**
```bash
# 1. Test critical endpoints
npm run test:smoke -- --env staging

# 2. Verify integrations
npm run test:integrations -- --env staging

# 3. Check performance
npm run test:performance -- --env staging
```

- [ ] All API endpoints responding
- [ ] Authentication flows working
- [ ] Database operations functional
- [ ] External integrations active
- [ ] Performance within acceptable limits

---

## ✅ **POST-DEPLOYMENT VERIFICATION**

### **Functional Testing**
- [ ] **Authentication Flow**
  - [ ] Wallet connection works
  - [ ] Farcaster authentication works
  - [ ] User sessions persist correctly
  - [ ] Logout functionality works

- [ ] **Raffle Status**
  - [ ] User status loads correctly
  - [ ] Ticket counts display accurately
  - [ ] Raffle information shows properly
  - [ ] Real-time updates work

- [ ] **Participation Flow**
  - [ ] Eligibility checking works
  - [ ] Participation validation functions
  - [ ] Ticket allocation correct
  - [ ] Error handling graceful

- [ ] **Leaderboard**
  - [ ] Leaderboard loads and displays
  - [ ] Rankings calculate correctly
  - [ ] Real-time updates functional
  - [ ] Pagination works

- [ ] **Farcaster Frames**
  - [ ] Frame endpoints accessible
  - [ ] Frame interactions work
  - [ ] Image generation functional
  - [ ] Button actions respond

### **Performance Verification**
```bash
# Run Lighthouse audit
npx lighthouse https://staging.like2win.app --chrome-flags="--headless"

# Test API response times
npm run test:response-times -- --env staging

# Check bundle sizes
npm run analyze:bundle
```

- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms (95th percentile)
- [ ] Bundle sizes within limits
- [ ] Core Web Vitals passing
- [ ] Lighthouse score > 85

### **Security Verification**
- [ ] HTTPS enforced everywhere
- [ ] Security headers present
- [ ] Authentication tokens secure
- [ ] API rate limiting active
- [ ] Input validation working
- [ ] No sensitive data in client code

### **Browser & Device Testing**
- [ ] **Desktop Browsers**
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)

- [ ] **Mobile Devices**
  - [ ] iOS Safari
  - [ ] Android Chrome
  - [ ] Responsive design works
  - [ ] Touch interactions work

### **Integration Testing**
- [ ] **Farcaster Integration**
  - [ ] Frame embeds display correctly
  - [ ] Authentication flow complete
  - [ ] Cast interactions tracked
  - [ ] API calls successful

- [ ] **OnchainKit Integration**
  - [ ] Wallet connections stable
  - [ ] Transaction handling works
  - [ ] Base network interactions
  - [ ] Error handling appropriate

- [ ] **Database Integration**
  - [ ] Read operations fast
  - [ ] Write operations reliable
  - [ ] Complex queries optimized
  - [ ] Connection pooling stable

---

## 🚨 **ISSUE RESOLUTION**

### **Common Issues & Solutions**

**Database Connection Failures:**
```bash
# Check connection string
echo $DATABASE_URL

# Test direct connection
psql $DATABASE_URL -c "SELECT 1;"

# Verify user permissions
npm run db:check-permissions -- --env staging
```

**API Authentication Errors:**
```bash
# Verify API keys
npm run verify-keys -- --env staging

# Test external service connectivity
curl -H "Authorization: Bearer $ONCHAINKIT_API_KEY" \
  https://api.onchainkit.xyz/health

# Check Farcaster hub connectivity
curl https://hub-api.neynar.com/v2/info
```

**Build/Deployment Failures:**
```bash
# Clean and rebuild
npm run clean && npm run build

# Check for missing dependencies
npm audit

# Verify environment variables
npm run verify-env -- --env staging
```

**Performance Issues:**
```bash
# Check server resources
npm run check:resources -- --env staging

# Analyze slow queries
npm run analyze:slow-queries -- --env staging

# Monitor memory usage
npm run monitor:memory -- --env staging
```

### **Rollback Procedures**

**Quick Rollback (Application Only):**
```bash
# Revert to previous deployment
npm run deploy:rollback -- --env staging --version previous

# Verify rollback
npm run verify:staging
```

**Full Rollback (Including Database):**
```bash
# Stop application
npm run stop:staging

# Restore database backup
npm run db:restore -- --env staging --backup latest

# Deploy previous application version
npm run deploy:rollback -- --env staging --version previous

# Verify system
npm run verify:staging
```

---

## 📊 **STAGING ENVIRONMENT MONITORING**

### **Key Metrics to Monitor**
- [ ] **Application Health**
  - [ ] Response times < 500ms average
  - [ ] Error rate < 1%
  - [ ] Uptime > 99.5%
  - [ ] Memory usage < 80%

- [ ] **Database Performance**
  - [ ] Query response times < 100ms average
  - [ ] Connection pool utilization < 70%
  - [ ] Slow query count < 10/hour
  - [ ] Database size growth normal

- [ ] **User Experience**
  - [ ] Page load times < 3 seconds
  - [ ] Authentication success rate > 98%
  - [ ] Feature completion rates > 95%
  - [ ] Error recovery rate > 90%

### **Monitoring Tools Setup**
```bash
# Set up application monitoring
npm run setup:monitoring -- --env staging

# Configure alerts
npm run configure:alerts -- --env staging

# Test alert system
npm run test:alerts -- --env staging
```

- [ ] Application performance monitoring active
- [ ] Database monitoring configured
- [ ] Error tracking enabled
- [ ] Alert notifications working
- [ ] Log aggregation setup

---

## 🎯 **SIGN-OFF CRITERIA**

### **Technical Sign-off**
- [ ] All automated tests passing
- [ ] Performance benchmarks met
- [ ] Security scans clean
- [ ] Integration tests successful
- [ ] Monitoring systems operational

### **Functional Sign-off**
- [ ] Core user flows tested and working
- [ ] Authentication mechanisms verified
- [ ] Data integrity confirmed
- [ ] Error handling validated
- [ ] Edge cases handled properly

### **Business Sign-off**
- [ ] Feature completeness verified
- [ ] User acceptance criteria met
- [ ] Compliance requirements satisfied
- [ ] Documentation updated
- [ ] Training materials prepared

### **Go/No-Go Decision Criteria**

**GO Criteria (All must be met):**
- ✅ Zero critical bugs
- ✅ All core functionality working
- ✅ Performance within acceptable limits
- ✅ Security requirements met
- ✅ Monitoring systems operational

**NO-GO Criteria (Any one triggers delay):**
- ❌ Critical functionality broken
- ❌ Security vulnerabilities present
- ❌ Performance significantly degraded
- ❌ Data integrity issues
- ❌ Integration failures

---

## 📝 **DOCUMENTATION & HANDOFF**

### **Deployment Documentation**
- [ ] Deployment steps documented
- [ ] Environment configuration recorded
- [ ] Database schema changes noted
- [ ] API changes documented
- [ ] Known issues logged

### **Testing Documentation**
- [ ] Test results compiled
- [ ] Performance metrics recorded
- [ ] User acceptance test results
- [ ] Bug reports and resolutions
- [ ] Risk assessment completed

### **Operational Handoff**
- [ ] Monitoring setup documented
- [ ] Alert escalation procedures defined
- [ ] Rollback procedures tested
- [ ] Support team briefed
- [ ] On-call procedures updated

---

## ✅ **FINAL CHECKLIST**

**Before marking staging deployment complete:**

- [ ] All technical verification complete
- [ ] All functional testing passed
- [ ] Performance metrics acceptable
- [ ] Security verification complete
- [ ] Documentation updated
- [ ] Team notified of deployment
- [ ] Monitoring confirmed operational
- [ ] Rollback plan verified
- [ ] Production deployment plan updated
- [ ] Stakeholders informed

**Deployment Approved By:**
- [ ] Technical Lead: _________________ Date: _________
- [ ] QA Lead: _________________ Date: _________
- [ ] Product Manager: _________________ Date: _________
- [ ] DevOps Lead: _________________ Date: _________

**Ready for Production:** ☐ YES ☐ NO

**If NO, blocking issues:**
1. _________________________________
2. _________________________________
3. _________________________________

**Next Steps:**
- [ ] Schedule production deployment
- [ ] Prepare production environment
- [ ] Notify stakeholders of timeline
- [ ] Begin production deployment checklist