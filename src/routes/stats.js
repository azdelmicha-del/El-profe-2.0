const { authenticateToken } = require('../middleware/auth');
const { getDb } = require('../db');

module.exports = function (app) {

    app.get('/api/stats', authenticateToken, async (req, res) => {
        try {
            const userId = req.userId;
            const totalConvs = await getDb().collection('conversations').countDocuments({ userId });
            const totalStudents = await getDb().collection('students').countDocuments({ userId });
            const totalRefs = await getDb().collection('references').countDocuments({ userId });

            const convs = await getDb().collection('conversations').find({ userId }, { projection: { createdAt: 1, messages: 1 } }).toArray();
            const totalMessages = convs.reduce((sum, c) => sum + (c.messages?.length || 0), 0);
            const thisMonth = convs.filter(c => c.createdAt && c.createdAt >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).length;

            const students = await getDb().collection('students').find({ userId }, { projection: { attendance: 1, grades: 1 } }).toArray();
            const totalAttendance = students.reduce((sum, s) => sum + (s.attendance?.length || 0), 0);
            const totalPresent = students.reduce((sum, s) => sum + (s.attendance?.filter(a => a.present)?.length || 0), 0);
            const totalGrades = students.reduce((sum, s) => sum + (s.grades?.length || 0), 0);

            res.json({
                conversations: totalConvs, messages: totalMessages, thisMonth,
                students: totalStudents, attendanceRecords: totalAttendance, presentCount: totalPresent,
                references: totalRefs, gradeRecords: totalGrades
            });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

};
