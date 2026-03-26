# Research Notes: MSF Laboratory Reporting Format

## Objective
Find the exact format/template of the monthly laboratory sitrep that MSF lab supervisors are expected to produce, so we can auto-generate it from LIMPS data.

## What we found

### 1. MSF QA Manual (Ch. 6) - Documentation requirements
Source: `references/MSF_Laboratory_QA_Manual_2019.pdf`, pages 27-29

The manual defines what documentation a lab must maintain:
- Reception book (6.4.1)
- Main laboratory register (6.4.2) -- this is what LIMPS digitizes
- Specific test registers (6.4.3)
- Laboratory incident book (6.5)
- Quality control workbook (6.7)

It mentions "monthly data collection" and "sitrep" as part of the supervisor's workload but does NOT include the sitrep template itself.

### 2. MSF HMIS system (DHIS2)
MSF uses DHIS2 as their HMIS. Laboratory data is entered under the service **"Diagnostic test" (code: `OUG_HSV_DT`)**.

GitHub repos explored:
- [msf-ocba/HMIS-Dictionary](https://github.com/msf-ocba/HMIS-Dictionary) -- AngularJS viewer app that queries live DHIS2 API. Contains NO static data dictionary. All data elements are fetched at runtime from authenticated DHIS2 instance.
- [msf-ocba/HMIS-Configuration](https://github.com/msf-ocba/HMIS-Configuration) -- Org hierarchy config. Confirmed "Diagnostic test" as the lab service code.
- [msf-ocba/MOL-ELISAQC](https://github.com/msf-ocba/MOL-ELISAQC) -- R Shiny app for ELISA QC (Mobile Outbreak Lab). Not related to routine reporting.

### 3. Sitrep R templates
- [R4EPI/sitrep](https://github.com/R4EPI/sitrep) -- Outbreak-focused (cholera, measles, meningitis). No routine laboratory template.

### 4. The sitrep template is internal
The monthly laboratory report template is NOT publicly available. It lives inside the MSF DHIS2 instance and is accessible only with MSF credentials.

## How to get the actual template

Thomas needs to do ONE of the following:
1. **Export the "Diagnostic test" dataset from DHIS2** -- go to DHIS2 > Data Entry > select the DT dataset for his site > screenshot or export the form structure
2. **Ask the HMIS team** -- email hmis@barcelona.msf.org (OCBA) or the equivalent for OCP
3. **Ask the diagnostic network** -- email diagnostic-network@msf.org
4. **Query the DHIS2 API** (if he has access):
   - Data elements for lab: `<server>/api/dataElements?filter=name:like:lab&fields=id,code,displayName`
   - Datasets for diagnostic test: `<server>/api/dataSets?filter=code:like:DT&fields=id,code,displayName,sections[displayName,dataElements[displayName,code]]`

## What we can build NOW (without the template)

Based on all sources (QA Manual, job descriptions, Thomas's field notes, WHO standards), the indicators that are almost certainly in the sitrep:

### Volume indicators (count per period)
- Total samples received
- Total tests performed (by category)
- Tests by ward (OPD, IPD, PED, ER, MATER, etc.)

### Positivity rates
- Malaria RDT: tested / positive / rate
- Malaria blood smear: tested / positive / rate
- HIV RDT: tested / positive / rate
- Syphilis: tested / positive / rate
- HBV: tested / positive / rate
- HCV: tested / positive / rate

### Blood bank (when module exists)
- Units collected
- Units transfused
- Units expired/discarded
- Donor screening results

### Quality indicators
- Average turnaround time (reception to result)
- Sample rejection rate (by reason)
- IQC pass/fail rate (when module exists)

### Recommendation
Build a dashboard with these indicators now. When Thomas provides the actual DHIS2 template, we map our indicators to the DHIS2 data elements and generate an export that can be copy-pasted or imported into DHIS2.
