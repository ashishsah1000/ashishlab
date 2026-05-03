import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottom: '1 solid #ccc', paddingBottom: 10 },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  title: { fontSize: 14, color: '#666', marginBottom: 5 },
  contact: { fontSize: 10, color: '#444' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 15, marginBottom: 10, textTransform: 'uppercase', color: '#333' },
  bio: { fontSize: 10, lineHeight: 1.4, marginBottom: 10 },
  expItem: { marginBottom: 10 },
  expHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  expRole: { fontSize: 12, fontWeight: 'bold' },
  expCompany: { fontSize: 11, fontStyle: 'italic' },
  expDate: { fontSize: 10, color: '#666' },
  expDesc: { fontSize: 10, marginBottom: 3, paddingLeft: 10 },
  projectItem: { marginBottom: 10 },
  projectTitle: { fontSize: 12, fontWeight: 'bold' },
  projectDesc: { fontSize: 10, marginTop: 3 },
  skillCategory: { fontSize: 11, fontWeight: 'bold', marginTop: 5 },
  skillList: { fontSize: 10, marginTop: 2 }
});

export const ResumePDF = ({ about, experience, projects, skills }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.name}>{about.name}</Text>
        <Text style={styles.title}>{about.title}</Text>
        <Text style={styles.contact}>Email: {about.email} | Phone: {about.phone} | {about.location}</Text>
      </View>

      <Text style={styles.sectionTitle}>Summary</Text>
      <Text style={styles.bio}>{about.bio.replace(/\n/g, " ")}</Text>

      <Text style={styles.sectionTitle}>Experience</Text>
      {experience.map((exp: any, i: number) => (
        <View key={i} style={styles.expItem}>
          <View style={styles.expHeader}>
            <View>
              <Text style={styles.expRole}>{exp.role}</Text>
              <Text style={styles.expCompany}>{exp.company}</Text>
            </View>
            <Text style={styles.expDate}>{exp.period} | {exp.location}</Text>
          </View>
          {exp.description.map((desc: string, j: number) => (
            <Text key={j} style={styles.expDesc}>• {desc}</Text>
          ))}
        </View>
      ))}

      <Text style={styles.sectionTitle}>Projects</Text>
      {projects.map((proj: any, i: number) => (
        <View key={i} style={styles.projectItem}>
          <Text style={styles.projectTitle}>{proj.title}</Text>
          <Text style={styles.projectDesc}>{proj.description}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Skills</Text>
      {skills.map((skill: any, i: number) => (
        <View key={i}>
          <Text style={styles.skillCategory}>{skill.category}: <Text style={styles.skillList}>{skill.skills.join(', ')}</Text></Text>
        </View>
      ))}
    </Page>
  </Document>
);
